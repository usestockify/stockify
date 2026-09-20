import type { Pool } from "pg";
import type { FileStore, IndexerStateRow, PonsEventRow, PonsLaunchRow } from "./types";
import { migrateIndexer } from "./types";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS indexer_state (
  id integer PRIMARY KEY,
  payload jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS pons_launches (
  token_address text PRIMARY KEY,
  payload jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS pons_events (
  transaction_hash text NOT NULL,
  log_index integer NOT NULL,
  block_number text,
  event_name text,
  token_address text,
  actor text,
  payload jsonb NOT NULL,
  created_at timestamptz,
  PRIMARY KEY (transaction_hash, log_index)
);
CREATE TABLE IF NOT EXISTS kv_meta (
  key text PRIMARY KEY,
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pons_events_actor_idx ON pons_events (actor);
CREATE INDEX IF NOT EXISTS pons_events_token_idx ON pons_events (token_address);
`;

export async function connectPostgres(url: string, startBlock: string): Promise<{
  load(): Promise<FileStore>;
  persist(store: FileStore): Promise<void>;
  pool: Pool;
}> {
  const pg = await import(/* webpackIgnore: true */ "pg");
  const pool = new pg.Pool({ connectionString: url, max: 4, idleTimeoutMillis: 30_000 });
  await pool.query(SCHEMA);

  async function load(): Promise<FileStore> {
    const [stateRes, launchRes, eventRes] = await Promise.all([
      pool.query<{ payload: IndexerStateRow }>("SELECT payload FROM indexer_state WHERE id = 1"),
      pool.query<{ payload: PonsLaunchRow }>("SELECT payload FROM pons_launches"),
      pool.query<{ payload: PonsEventRow }>("SELECT payload FROM pons_events"),
    ]);
    return {
      indexer: migrateIndexer(stateRes.rows[0]?.payload, startBlock),
      launches: launchRes.rows.map((r) => r.payload),
      events: eventRes.rows.map((r) => r.payload),
    };
  }

  async function persist(store: FileStore) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("INSERT INTO indexer_state (id, payload) VALUES (1, $1::jsonb) ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload", [
        JSON.stringify(store.indexer),
      ]);
      for (const launch of store.launches) {
        await client.query(
          "INSERT INTO pons_launches (token_address, payload) VALUES ($1, $2::jsonb) ON CONFLICT (token_address) DO UPDATE SET payload = EXCLUDED.payload",
          [launch.tokenAddress.toLowerCase(), JSON.stringify(launch)],
        );
      }
      for (const event of store.events) {
        await client.query(
          `INSERT INTO pons_events (transaction_hash, log_index, block_number, event_name, token_address, actor, payload, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)
           ON CONFLICT (transaction_hash, log_index) DO NOTHING`,
          [
            event.transactionHash,
            event.logIndex,
            event.blockNumber,
            event.eventName,
            event.tokenAddress,
            event.actor,
            JSON.stringify(event),
            event.createdAt,
          ],
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  return { load, persist, pool };
}
