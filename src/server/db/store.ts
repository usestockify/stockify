import fs from "fs";
import path from "path";
import type { FileStore, IndexerStateRow, PonsEventRow, PonsLaunchRow, Store } from "./types";
import { emptyIndexer, migrateIndexer } from "./types";

export type { FileStore, IndexerStateRow, PonsEventRow, PonsLaunchRow, Store } from "./types";
export { emptyIndexer, emptyLaunchFields, migrateIndexer } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "pons-index.json");

type PersistFn = (store: FileStore) => void;

let mem: FileStore | null = null;
let engineName = "json";
let persist: PersistFn = saveJson;
let initPromise: Promise<void> | null = null;
let lastMtime = 0;
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let persistQueued: FileStore | null = null;

function isWriter() {
  return process.env.STOCKIFY_INDEXER_WRITER === "1" || process.env.STOCKIFY_INDEXER_EXTERNAL !== "1";
}

function sleep(ms: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

export function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadJson(startBlock: string): FileStore {
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE, "utf8")) as Partial<FileStore>;
    if (!parsed || !Array.isArray(parsed.launches)) throw new Error("invalid");
    return {
      indexer: migrateIndexer(parsed.indexer, startBlock),
      launches: parsed.launches as PonsLaunchRow[],
      events: Array.isArray(parsed.events) ? (parsed.events as PonsEventRow[]) : [],
    };
  } catch {
    return { indexer: emptyIndexer(startBlock), launches: [], events: [] };
  }
}

function saveJson(store: FileStore) {
  if (!isWriter()) return;
  ensureDataDir();
  const tmp = `${FILE}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(tmp, JSON.stringify(store));
    for (let i = 0; i < 8; i++) {
      try {
        fs.copyFileSync(tmp, FILE);
        lastMtime = fs.statSync(FILE).mtimeMs;
        break;
      } catch {
        sleep(40);
      }
    }
  } catch {
    /* Windows file locks must not crash the indexer */
  } finally {
    try {
      fs.unlinkSync(tmp);
    } catch {
      /* ignore */
    }
  }
}

function persistSoon(store: FileStore) {
  persistQueued = store;
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    if (persistQueued) persist(persistQueued);
  }, 200);
}

function reloadFromDisk(startBlock: string) {
  if (isWriter() && mem) return;
  try {
    const mtime = fs.statSync(FILE).mtimeMs;
    if (mem && mtime <= lastMtime) return;
    lastMtime = mtime;
    mem = loadJson(startBlock);
  } catch {
    if (!mem) mem = { indexer: emptyIndexer(startBlock), launches: [], events: [] };
  }
}

function applyLaunchUpsert(cur: FileStore, rows: PonsLaunchRow[]) {
  if (!rows.length) return;
  const byKey = new Map(cur.launches.map((l) => [`${l.transactionHash}:${l.logIndex}`, l]));
  for (const row of rows) {
    const key = `${row.transactionHash}:${row.logIndex}`;
    const prev = byKey.get(key) ?? cur.launches.find((l) => l.tokenAddress.toLowerCase() === row.tokenAddress.toLowerCase());
    byKey.set(key, prev ? { ...prev, ...row } : row);
  }
  const byToken = new Map<string, PonsLaunchRow>();
  for (const row of byKey.values()) byToken.set(row.tokenAddress.toLowerCase(), row);
  cur.launches = [...byToken.values()];
}

function applyEventUpsert(cur: FileStore, rows: PonsEventRow[]) {
  if (!rows.length) return;
  const keys = new Set(cur.events.map((e) => `${e.transactionHash}:${e.logIndex}`));
  for (const row of rows) {
    const key = `${row.transactionHash}:${row.logIndex}`;
    if (keys.has(key)) continue;
    cur.events.push(row);
    keys.add(key);
  }
}

export async function initStore(startBlock: string) {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    ensureDataDir();
    if (!isWriter()) {
      mem = loadJson(startBlock);
      persist = () => {};
      engineName = "json";
      return;
    }
    const url = process.env.DATABASE_URL?.trim() ?? "";
    if (url.startsWith("postgres")) {
      try {
        const { createRequire } = await import("module");
        const req = createRequire(path.join(process.cwd(), "package.json"));
        const pg = req("pg") as typeof import("pg");
        const pool = new pg.Pool({ connectionString: url, max: 4, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 2_000 });
        await pool.query(`
CREATE TABLE IF NOT EXISTS indexer_state (id integer PRIMARY KEY, payload jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS pons_launches (token_address text PRIMARY KEY, payload jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS pons_events (
  transaction_hash text NOT NULL, log_index integer NOT NULL, block_number text, event_name text,
  token_address text, actor text, payload jsonb NOT NULL, created_at timestamptz,
  PRIMARY KEY (transaction_hash, log_index)
);
CREATE TABLE IF NOT EXISTS kv_meta (key text PRIMARY KEY, payload jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
`);
        const [stateRes, launchRes, eventRes] = await Promise.all([
          pool.query("SELECT payload FROM indexer_state WHERE id = 1"),
          pool.query("SELECT payload FROM pons_launches"),
          pool.query("SELECT payload FROM pons_events"),
        ]);
        mem = {
          indexer: migrateIndexer(stateRes.rows[0]?.payload, startBlock),
          launches: launchRes.rows.map((r: { payload: PonsLaunchRow }) => r.payload),
          events: eventRes.rows.map((r: { payload: PonsEventRow }) => r.payload),
        };
        engineName = "postgres";
        persist = (store) => {
          saveJson(store);
          void (async () => {
            const client = await pool.connect();
            try {
              await client.query("BEGIN");
              await client.query("INSERT INTO indexer_state (id, payload) VALUES (1, $1::jsonb) ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload", [JSON.stringify(store.indexer)]);
              for (const launch of store.launches) {
                await client.query("INSERT INTO pons_launches (token_address, payload) VALUES ($1, $2::jsonb) ON CONFLICT (token_address) DO UPDATE SET payload = EXCLUDED.payload", [launch.tokenAddress.toLowerCase(), JSON.stringify(launch)]);
              }
              for (const event of store.events) {
                await client.query(
                  `INSERT INTO pons_events (transaction_hash, log_index, block_number, event_name, token_address, actor, payload, created_at)
                   VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8) ON CONFLICT (transaction_hash, log_index) DO NOTHING`,
                  [event.transactionHash, event.logIndex, event.blockNumber, event.eventName, event.tokenAddress, event.actor, JSON.stringify(event), event.createdAt],
                );
              }
              await client.query("COMMIT");
            } catch {
              await client.query("ROLLBACK");
            } finally {
              client.release();
            }
          })();
        };
        persist(mem);
        return;
      } catch {
        engineName = "postgres-unavailable";
      }
    }
    mem = loadJson(startBlock);
    persist = saveJson;
    if (engineName !== "postgres-unavailable") engineName = "json";
    persist(mem);
  })();
  return initPromise;
}

export function pingStore() {
  ensureDataDir();
  return engineName || "json";
}

export function getStore(startBlock: string): Store {
  if (!mem) {
    ensureDataDir();
    mem = loadJson(startBlock);
    persist = saveJson;
    if (!engineName) engineName = "json";
    void initStore(startBlock);
  }
  reloadFromDisk(startBlock);
  return {
    get engine() {
      return engineName;
    },
    getIndexer() {
      reloadFromDisk(startBlock);
      return mem!.indexer;
    },
    setIndexer(row: IndexerStateRow) {
      mem!.indexer = row;
      persistSoon(mem!);
    },
    upsertLaunches(rows: PonsLaunchRow[]) {
      applyLaunchUpsert(mem!, rows);
      persistSoon(mem!);
    },
    updateLaunch(tokenAddress: string, patch: Partial<PonsLaunchRow>) {
      const i = mem!.launches.findIndex((l) => l.tokenAddress.toLowerCase() === tokenAddress.toLowerCase());
      if (i < 0) return;
      mem!.launches[i] = { ...mem!.launches[i], ...patch };
      persistSoon(mem!);
    },
    allLaunches() {
      reloadFromDisk(startBlock);
      return mem!.launches;
    },
    upsertEvents(rows: PonsEventRow[]) {
      applyEventUpsert(mem!, rows);
      persistSoon(mem!);
    },
    eventsForActor(actor: string, limit = 40) {
      reloadFromDisk(startBlock);
      const key = actor.toLowerCase();
      return mem!.events
        .filter((e) => e.actor?.toLowerCase() === key || e.payload.buyer?.toLowerCase() === key || e.payload.recipient?.toLowerCase() === key || e.payload.deployer?.toLowerCase() === key)
        .sort((a, b) => Number(BigInt(b.blockNumber) - BigInt(a.blockNumber)))
        .slice(0, limit);
    },
  };
}
