import { decodeEventLog, parseAbiItem, type Address, type Log } from "viem";
import { indexerClient, indexerProviderLabel } from "@/lib/chain";
import { failed, ready, type DataEnvelope } from "@/lib/data";
import { PONS_FACTORY_START_BLOCK, PONS_PHASE, PONS_V2, type PonsLaunch } from "@/lib/pons/config";
import { resolveLaunch } from "@/lib/pons/launches";
import { sanityPonsCurve } from "@/lib/sanity";
import {
  emptyLaunchFields,
  ensureDataDir,
  getStore,
  initStore,
  type IndexerStateRow,
  type PonsEventRow,
  type PonsLaunchRow,
} from "@/server/db/store";

const CONFIRMATIONS = 8n;
const DEFAULT_CHUNK = 20_000n;
const LIVE_CHUNK = 4_000n;
const START = PONS_FACTORY_START_BLOCK.toString();

const tokenLaunchedEvent = parseAbiItem(
  "event TokenLaunched(address indexed token, address indexed curve, address indexed deployer, address pairToken, uint256 launchConfigId, uint256 graduationThreshold)",
);
const launchSweptEvent = parseAbiItem("event LaunchSwept(address indexed token, uint256 sweptQuote, uint256 sweptTokens)");
const poolGraduatedEvent = parseAbiItem("event PoolGraduated(address indexed token, bytes32 indexed poolId, address indexed pool)");
const launchRescuedEvent = parseAbiItem("event LaunchRescued(address indexed token, uint256 quoteReturned)");
const curveBuyEvent = parseAbiItem("event Buy(address indexed buyer, address indexed recipient, uint256 quoteIn, uint256 tokensOut, uint256 fee)");
const curveSellEvent = parseAbiItem("event Sell(address indexed seller, address indexed recipient, uint256 tokensIn, uint256 quoteOut, uint256 fee)");

type TickResult = {
  indexed: IndexerStateRow;
  launchesAdded: number;
  chunks: number;
  engine: string;
};

const g = globalThis as unknown as {
  __ponsTick?: Promise<TickResult> | null;
  __ponsLoop?: boolean;
  __ponsRate?: { at: number; block: bigint };
};

function store() {
  return getStore(START);
}

function emptyRow(): ReturnType<typeof emptyLaunchFields> {
  return emptyLaunchFields();
}

function toLaunchRow(log: Log): PonsLaunchRow | null {
  try {
    const parsed = decodeEventLog({ abi: [tokenLaunchedEvent], data: log.data, topics: log.topics });
    if (parsed.eventName !== "TokenLaunched") return null;
    const args = parsed.args as {
      token: Address;
      curve: Address;
      deployer: Address;
      pairToken: Address;
      launchConfigId: bigint;
      graduationThreshold: bigint;
    };
    return {
      tokenAddress: args.token,
      curveAddress: args.curve,
      deployer: args.deployer,
      pairToken: args.pairToken,
      launchConfigId: args.launchConfigId.toString(),
      graduationThreshold: args.graduationThreshold.toString(),
      blockNumber: (log.blockNumber ?? 0n).toString(),
      transactionHash: log.transactionHash ?? "0x",
      logIndex: Number(log.logIndex ?? 0),
      createdAt: new Date().toISOString(),
      ...emptyRow(),
    };
  } catch {
    return null;
  }
}

function decodeFactoryExtras(log: Log): PonsEventRow | null {
  const createdAt = new Date().toISOString();
  const base = {
    transactionHash: log.transactionHash ?? "0x",
    logIndex: Number(log.logIndex ?? 0),
    blockNumber: (log.blockNumber ?? 0n).toString(),
    createdAt,
  };
  try {
    const swept = decodeEventLog({ abi: [launchSweptEvent], data: log.data, topics: log.topics });
    if (swept.eventName === "LaunchSwept") {
      const args = swept.args as { token: Address; sweptQuote: bigint; sweptTokens: bigint };
      return { ...base, eventName: "LaunchSwept", tokenAddress: args.token, actor: null, payload: { sweptQuote: args.sweptQuote.toString(), sweptTokens: args.sweptTokens.toString() } };
    }
  } catch {
    /* next */
  }
  try {
    const grad = decodeEventLog({ abi: [poolGraduatedEvent], data: log.data, topics: log.topics });
    if (grad.eventName === "PoolGraduated") {
      const args = grad.args as { token: Address; poolId: `0x${string}`; pool: Address };
      return { ...base, eventName: "PoolGraduated", tokenAddress: args.token, actor: null, payload: { poolId: args.poolId, pool: args.pool } };
    }
  } catch {
    /* next */
  }
  try {
    const rescued = decodeEventLog({ abi: [launchRescuedEvent], data: log.data, topics: log.topics });
    if (rescued.eventName === "LaunchRescued") {
      const args = rescued.args as { token: Address; quoteReturned: bigint };
      return { ...base, eventName: "LaunchRescued", tokenAddress: args.token, actor: null, payload: { quoteReturned: args.quoteReturned.toString() } };
    }
  } catch {
    /* next */
  }
  return null;
}

function decodeCurveTrade(log: Log, tokenAddress: string): PonsEventRow | null {
  const createdAt = new Date().toISOString();
  const base = {
    transactionHash: log.transactionHash ?? "0x",
    logIndex: Number(log.logIndex ?? 0),
    blockNumber: (log.blockNumber ?? 0n).toString(),
    tokenAddress,
    createdAt,
  };
  try {
    const buy = decodeEventLog({ abi: [curveBuyEvent], data: log.data, topics: log.topics });
    if (buy.eventName === "Buy") {
      const args = buy.args as { buyer: Address; recipient: Address; quoteIn: bigint; tokensOut: bigint; fee: bigint };
      return { ...base, eventName: "Buy", actor: args.buyer, payload: { buyer: args.buyer, recipient: args.recipient, quoteIn: args.quoteIn.toString(), tokensOut: args.tokensOut.toString(), fee: args.fee.toString() } };
    }
  } catch {
    /* next */
  }
  try {
    const sell = decodeEventLog({ abi: [curveSellEvent], data: log.data, topics: log.topics });
    if (sell.eventName === "Sell") {
      const args = sell.args as { seller: Address; recipient: Address; tokensIn: bigint; quoteOut: bigint; fee: bigint };
      return { ...base, eventName: "Sell", actor: args.seller, payload: { seller: args.seller, recipient: args.recipient, tokensIn: args.tokensIn.toString(), quoteOut: args.quoteOut.toString(), fee: args.fee.toString() } };
    }
  } catch {
    /* next */
  }
  return null;
}

async function getLogsAdaptive(fromBlock: bigint, toBlock: bigint, initialSpan: bigint) {
  const client = indexerClient();
  const out: Log[] = [];
  let start = fromBlock;
  let span = initialSpan < 1n ? 1n : initialSpan;
  let used = span;
  while (start <= toBlock) {
    const end = start + span - 1n > toBlock ? toBlock : start + span - 1n;
    try {
      const launched = await client.getLogs({ address: PONS_V2.factory, event: tokenLaunchedEvent, fromBlock: start, toBlock: end });
      const extras =
        end - start <= LIVE_CHUNK
          ? await client.getLogs({ address: PONS_V2.factory, fromBlock: start, toBlock: end }).catch(() => [])
          : [];
      out.push(...launched);
      for (const log of extras) {
        if (launched.some((l) => l.transactionHash === log.transactionHash && l.logIndex === log.logIndex)) continue;
        out.push(log);
      }
      start = end + 1n;
      used = span;
      if (span < 100_000n) span *= 2n;
    } catch (error) {
      if (span <= 1n) throw error instanceof Error ? error : new Error("log range rejected");
      span = span / 2n;
      if (span < 1n) span = 1n;
    }
  }
  return { logs: out, span: used };
}

async function enrichLaunch(row: PonsLaunchRow) {
  const resolved = await resolveLaunch(row.tokenAddress as Address, {
    token: row.tokenAddress as Address,
    curve: row.curveAddress as Address,
    deployer: row.deployer as Address,
    pairToken: row.pairToken as Address,
    launchConfigId: row.launchConfigId,
    graduationThreshold: row.graduationThreshold,
    blockNumber: row.blockNumber,
    transactionHash: row.transactionHash as `0x${string}`,
  });
  if (!resolved.data) return;
  const launch = resolved.data;
  const issues = await sanityPonsCurve(launch).catch(() => []);
  store().updateLaunch(row.tokenAddress, {
    phase: launch.phase,
    state: launch.state,
    creatorFeeRecipient: launch.creatorFeeRecipient,
    poolFee: launch.poolFee,
    tickSpacing: launch.tickSpacing,
    creatorTaxBps: launch.creatorTaxBps,
    buybackEnabled: launch.buybackEnabled,
    sweptQuote: launch.sweptQuote,
    sweptTokens: launch.sweptTokens,
    sweptAt: launch.sweptAt,
    pairKind: launch.pair.kind,
    pairSymbol: launch.pair.symbol,
    pairName: launch.pair.name,
    pairDecimals: launch.pair.decimals,
    pairLogoUrl: launch.pair.logoUrl,
    pairTicker: launch.pair.ticker,
    pairMultiplier: launch.pair.multiplier,
    tokenName: launch.metadata.name,
    tokenSymbol: launch.metadata.symbol,
    tokenDecimals: launch.metadata.decimals,
    tokenLogo: launch.metadata.logo,
    quoteReserve: launch.curveLive?.quoteReserve ?? null,
    tokenReserve: launch.curveLive?.tokenReserve ?? null,
    realQuoteReserve: launch.curveLive?.realQuoteReserve ?? null,
    sellableTokens: launch.curveLive?.sellableTokens ?? null,
    reservedTokens: launch.curveLive?.reservedTokens ?? null,
    readyToGraduate: launch.curveLive?.readyToGraduate ?? null,
    graduated: launch.curveLive?.graduated ?? null,
    feeBps: launch.curveLive?.feeBps ?? null,
    curveCreatorTaxBps: launch.curveLive?.creatorTaxBps ?? null,
    poolId: launch.poolId,
    poolManager: launch.poolManager,
    enrichedAt: new Date().toISOString(),
    sanityError: issues.length ? issues.map((i) => i.message).join("; ") : null,
  });
}

function ingestLogs(logs: Log[]) {
  const launches = logs.map(toLaunchRow).filter((r): r is PonsLaunchRow => Boolean(r));
  const events: PonsEventRow[] = launches.map((r) => ({
    transactionHash: r.transactionHash,
    logIndex: r.logIndex,
    blockNumber: r.blockNumber,
    eventName: "TokenLaunched",
    tokenAddress: r.tokenAddress,
    actor: r.deployer,
    payload: { curve: r.curveAddress, pairToken: r.pairToken, deployer: r.deployer },
    createdAt: r.createdAt,
  }));
  for (const log of logs) {
    const extra = decodeFactoryExtras(log);
    if (extra) {
      events.push(extra);
      if (extra.eventName === "PoolGraduated" && extra.tokenAddress) {
        store().updateLaunch(extra.tokenAddress, { state: "GRADUATED", phase: 2, poolId: extra.payload.poolId, poolManager: extra.payload.pool });
      }
      if (extra.eventName === "LaunchSwept" && extra.tokenAddress) {
        store().updateLaunch(extra.tokenAddress, { state: "SWEPT", phase: 1, sweptQuote: extra.payload.sweptQuote, sweptTokens: extra.payload.sweptTokens });
      }
    }
  }
  store().upsertLaunches(launches);
  store().upsertEvents(events);
  return launches.length;
}

async function indexCurveTrades(fromBlock: bigint, toBlock: bigint) {
  const curves = store()
    .allLaunches()
    .filter((l) => l.state === "CURVE")
    .slice(0, 80);
  if (!curves.length) return;
  const client = indexerClient();
  try {
    const logs = await client.getLogs({
      address: curves.map((c) => c.curveAddress as Address),
      fromBlock,
      toBlock,
    });
    const events = logs.flatMap((log) => {
      const token = curves.find((c) => c.curveAddress.toLowerCase() === (log.address ?? "").toLowerCase())?.tokenAddress ?? null;
      if (!token) return [];
      const row = decodeCurveTrade(log, token);
      return row ? [row] : [];
    });
    store().upsertEvents(events);
  } catch {
    /* live trades are best-effort */
  }
}

function rateUpdate(state: IndexerStateRow, backfill: bigint, confirmed: bigint): Pick<IndexerStateRow, "blocksPerSecond" | "etaSeconds"> {
  const now = Date.now();
  const prev = g.__ponsRate;
  g.__ponsRate = { at: now, block: backfill };
  if (!prev || now <= prev.at) return { blocksPerSecond: state.blocksPerSecond, etaSeconds: state.etaSeconds };
  const dt = (now - prev.at) / 1000;
  const delta = Number(backfill - prev.block);
  const instant = dt > 0 && delta >= 0 ? delta / dt : state.blocksPerSecond ?? 0;
  const ema = state.blocksPerSecond != null ? state.blocksPerSecond * 0.7 + instant * 0.3 : instant;
  const remaining = confirmed > backfill ? Number(confirmed - backfill) : 0;
  const eta = ema > 0 ? Math.round(remaining / ema) : null;
  return { blocksPerSecond: Number.isFinite(ema) ? ema : null, etaSeconds: eta };
}

async function seedFromExplorer() {
  if (store().allLaunches().length) return;
  const { getTokenLaunchedEvents } = await import("@/lib/pons/events");
  const seeded = await getTokenLaunchedEvents().catch(() => null);
  if (!seeded?.data?.length) return;
  store().upsertLaunches(
    seeded.data.map((event, i) => ({
      tokenAddress: event.token,
      curveAddress: event.curve,
      deployer: event.deployer,
      pairToken: event.pairToken,
      launchConfigId: event.launchConfigId,
      graduationThreshold: event.graduationThreshold,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash ?? `0xseed${i}`,
      logIndex: i,
      createdAt: new Date().toISOString(),
      ...emptyRow(),
    })),
  );
}

export async function tickIndexer(opts?: { maxChunks?: number; budgetMs?: number; enrich?: number }): Promise<TickResult> {
  if (g.__ponsTick) return g.__ponsTick;
  const work = (async () => {
    ensureDataDir();
    await initStore(START);
    const db = store();
    const state = db.getIndexer();
    const maxChunks = opts?.maxChunks ?? 2;
    const budgetMs = opts?.budgetMs ?? 8_000;
    const started = Date.now();
    let chunks = 0;
    let launchesAdded = 0;
    try {
      const client = indexerClient();
      const head = await client.getBlockNumber();
      const confirmed = head > CONFIRMATIONS ? head - CONFIRMATIONS : 0n;
      await seedFromExplorer();

      let liveFrom = BigInt(state.liveHeadBlock || "0");
      if (liveFrom === 0n) liveFrom = confirmed;
      let backfill = BigInt(state.historicalBackfillBlock || START);
      if (backfill < PONS_FACTORY_START_BLOCK) backfill = PONS_FACTORY_START_BLOCK;
      if (confirmed > liveFrom + 1_000_000n && liveFrom <= backfill + 200_000n) {
        liveFrom = confirmed > 2_000n ? confirmed - 2_000n : confirmed;
        g.__ponsRate = { at: Date.now(), block: backfill };
      }
      let chunkSize = BigInt(state.chunkSize || DEFAULT_CHUNK.toString());
      if (chunkSize < 1n) chunkSize = 1n;

      db.setIndexer({
        ...state,
        status: "syncing",
        liveStatus: liveFrom >= confirmed ? "caught-up" : "syncing",
        backfillStatus: backfill >= confirmed ? "caught-up" : "syncing",
        chainHead: head.toString(),
        lastError: null,
        startBlock: START,
        provider: indexerProviderLabel(),
      });

      if (liveFrom < confirmed && Date.now() - started < budgetMs) {
        const to = liveFrom + LIVE_CHUNK > confirmed ? confirmed : liveFrom + LIVE_CHUNK;
        const from = liveFrom + 1n;
        if (from <= to) {
          const { logs } = await getLogsAdaptive(from, to, LIVE_CHUNK);
          launchesAdded += ingestLogs(logs);
          await indexCurveTrades(from, to);
          liveFrom = to;
          chunks += 1;
        }
      }

      while (chunks < maxChunks && Date.now() - started < budgetMs && backfill < confirmed && backfill < liveFrom) {
        const span = chunkSize;
        const to = backfill + span - 1n > confirmed ? confirmed : backfill + span - 1n;
        const from = backfill === PONS_FACTORY_START_BLOCK && backfill === BigInt(state.historicalBackfillBlock || START) ? backfill : backfill + 1n;
        if (from > to) break;
        const { logs, span: used } = await getLogsAdaptive(from, to, span);
        launchesAdded += ingestLogs(logs);
        backfill = to;
        chunkSize = used < 100_000n ? used * 2n : used;
        chunks += 1;
        const rates = rateUpdate(db.getIndexer(), backfill, confirmed);
        db.setIndexer({
          ...db.getIndexer(),
          lastIndexedBlock: liveFrom.toString(),
          liveHeadBlock: liveFrom.toString(),
          historicalBackfillBlock: backfill.toString(),
          chainHead: head.toString(),
          lastSuccessAt: new Date().toISOString(),
          lastError: null,
          chunkSize: chunkSize.toString(),
          provider: indexerProviderLabel(),
          liveStatus: liveFrom >= confirmed ? "caught-up" : "syncing",
          backfillStatus: backfill >= confirmed ? "caught-up" : "syncing",
          status: backfill >= confirmed && liveFrom >= confirmed ? "caught-up" : "syncing",
          ...rates,
        });
      }

      const rates = rateUpdate(db.getIndexer(), backfill, confirmed);
      db.setIndexer({
        ...db.getIndexer(),
        lastIndexedBlock: liveFrom.toString(),
        liveHeadBlock: liveFrom.toString(),
        historicalBackfillBlock: backfill.toString(),
        chainHead: head.toString(),
        lastSuccessAt: new Date().toISOString(),
        lastError: null,
        chunkSize: chunkSize.toString(),
        provider: indexerProviderLabel(),
        liveStatus: liveFrom >= confirmed ? "caught-up" : "syncing",
        backfillStatus: backfill >= confirmed ? "caught-up" : "syncing",
        status: backfill >= confirmed && liveFrom >= confirmed ? "caught-up" : "syncing",
        ...rates,
      });

      const pending = db.allLaunches().filter((l) => !l.enrichedAt).slice(0, opts?.enrich ?? 8);
      const staleCurve = db.allLaunches().filter((l) => l.state === "CURVE" && l.enrichedAt).slice(0, 4);
      for (const row of [...pending, ...staleCurve]) {
        if (Date.now() - started > budgetMs) break;
        await enrichLaunch(row);
      }
      return { indexed: db.getIndexer(), launchesAdded, chunks, engine: db.engine };
    } catch (error) {
      const message = error instanceof Error ? error.message : "indexer failed";
      const degraded: IndexerStateRow = { ...db.getIndexer(), status: "error", lastError: message, startBlock: START };
      db.setIndexer(degraded);
      return { indexed: degraded, launchesAdded, chunks, engine: db.engine };
    } finally {
      g.__ponsTick = null;
    }
  })();
  g.__ponsTick = work;
  return work;
}

export function indexerSnapshot() {
  const db = store();
  const indexed = db.getIndexer();
  const head = indexed.chainHead ? BigInt(indexed.chainHead) : null;
  const start = BigInt(indexed.startBlock || START);
  const backfill = BigInt(indexed.historicalBackfillBlock || START);
  const live = BigInt(indexed.liveHeadBlock || "0");
  const span = head != null && head > start ? head - start : 0n;
  const done = backfill > start ? backfill - start : 0n;
  const progressPct = span > 0n ? Number((done * 1000n) / span) / 10 : 0;
  const liveLag = head != null && head > live ? (head - live).toString() : "0";
  const backfillLag = head != null && head > backfill ? (head - backfill).toString() : "0";
  const operational = indexed.liveStatus === "caught-up" && indexed.backfillStatus === "caught-up";
  return {
    ...indexed,
    blocksBehind: backfillLag,
    liveLag,
    backfillLag,
    progressPct,
    label: operational ? "OPERATIONAL" : `SYNCING ${progressPct.toFixed(1)}%`,
    launchCount: db.allLaunches().length,
    engine: db.engine,
    factory: PONS_V2.factory,
    startBlock: START,
  };
}

export function rowToLaunch(row: PonsLaunchRow): PonsLaunch {
  return {
    token: row.tokenAddress as Address,
    curve: row.curveAddress as Address,
    deployer: row.deployer as Address,
    creatorFeeRecipient: (row.creatorFeeRecipient ?? row.deployer) as Address,
    pair: {
      address: row.pairToken as Address,
      kind: (row.pairKind as PonsLaunch["pair"]["kind"]) ?? "other",
      native: row.pairToken.toLowerCase() === "0x0000000000000000000000000000000000000000",
      symbol: row.pairSymbol,
      name: row.pairName,
      decimals: row.pairDecimals,
      logoUrl: row.pairLogoUrl,
      multiplier: row.pairMultiplier,
      ticker: row.pairTicker,
    },
    graduationThreshold: row.graduationThreshold,
    poolFee: row.poolFee ?? 0,
    tickSpacing: row.tickSpacing ?? 0,
    creatorTaxBps: row.creatorTaxBps ?? 0,
    buybackEnabled: row.buybackEnabled ?? false,
    state: (PONS_PHASE[row.phase] ?? row.state ?? "UNKNOWN") as PonsLaunch["state"],
    phase: row.phase,
    sweptQuote: row.sweptQuote ?? "0",
    sweptTokens: row.sweptTokens ?? "0",
    sweptAt: row.sweptAt ?? "0",
    exists: true,
    launchConfigId: row.launchConfigId,
    metadata: {
      name: row.tokenName,
      symbol: row.tokenSymbol,
      decimals: row.tokenDecimals,
      logo: row.tokenLogo,
      description: null,
    },
    poolId: row.poolId,
    poolManager: row.poolManager,
    curveLive: row.quoteReserve
      ? {
          graduated: row.graduated,
          quoteReserve: row.quoteReserve,
          tokenReserve: row.tokenReserve,
          readyToGraduate: row.readyToGraduate,
          realQuoteReserve: row.realQuoteReserve,
          sellableTokens: row.sellableTokens,
          reservedTokens: row.reservedTokens,
          graduationThreshold: row.graduationThreshold,
          feeBps: row.feeBps,
          creatorTaxBps: row.curveCreatorTaxBps,
        }
      : null,
  };
}

export async function getIndexedLaunches(): Promise<DataEnvelope<PonsLaunch[]>> {
  await initStore(START).catch(() => null);
  startIndexerLoop();
  const rows = store().allLaunches();
  if (!rows.length) {
    const snap = indexerSnapshot();
    if (snap.status === "error") return failed(snap.lastError ?? "PONS indexer error");
    return ready([], snap.lastSuccessAt ?? undefined);
  }
  return ready(rows.filter((r) => !r.sanityError).map(rowToLaunch));
}

export function startIndexerLoop() {
  if (process.env.STOCKIFY_INDEXER_EXTERNAL === "1") return;
  if (g.__ponsLoop) return;
  g.__ponsLoop = true;
  ensureDataDir();
  void initStore(START);
  const run = async () => {
    try {
      await tickIndexer({ maxChunks: 6, budgetMs: 20_000, enrich: 12 });
    } catch {
      /* persisted on the indexer row */
    }
    const snap = indexerSnapshot();
    const delay = snap.liveStatus === "caught-up" && snap.backfillStatus === "caught-up" ? 12_000 : 1_200;
    setTimeout(run, delay);
  };
  void run();
}
