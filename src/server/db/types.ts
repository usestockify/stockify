export type IndexerStatus = "idle" | "syncing" | "caught-up" | "degraded" | "error";

export type IndexerStateRow = {
  lastIndexedBlock: string;
  liveHeadBlock: string;
  historicalBackfillBlock: string;
  chainHead: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  status: IndexerStatus;
  liveStatus: IndexerStatus;
  backfillStatus: IndexerStatus;
  startBlock: string;
  chunkSize: string;
  blocksPerSecond: number | null;
  etaSeconds: number | null;
  provider: string | null;
};

export type PonsLaunchRow = {
  tokenAddress: string;
  curveAddress: string;
  deployer: string;
  pairToken: string;
  launchConfigId: string;
  graduationThreshold: string;
  blockNumber: string;
  transactionHash: string;
  logIndex: number;
  createdAt: string;
  phase: number;
  state: string;
  creatorFeeRecipient: string | null;
  poolFee: number | null;
  tickSpacing: number | null;
  creatorTaxBps: number | null;
  buybackEnabled: boolean | null;
  sweptQuote: string | null;
  sweptTokens: string | null;
  sweptAt: string | null;
  pairKind: string | null;
  pairSymbol: string | null;
  pairName: string | null;
  pairDecimals: number | null;
  pairLogoUrl: string | null;
  pairTicker: string | null;
  pairMultiplier: string | null;
  tokenName: string | null;
  tokenSymbol: string | null;
  tokenDecimals: number | null;
  tokenLogo: string | null;
  quoteReserve: string | null;
  tokenReserve: string | null;
  realQuoteReserve: string | null;
  sellableTokens: string | null;
  reservedTokens: string | null;
  readyToGraduate: boolean | null;
  graduated: boolean | null;
  feeBps: string | null;
  curveCreatorTaxBps: string | null;
  poolId: string | null;
  poolManager: string | null;
  enrichedAt: string | null;
  sanityError: string | null;
};

export type PonsEventRow = {
  transactionHash: string;
  logIndex: number;
  blockNumber: string;
  eventName: string;
  tokenAddress: string | null;
  actor: string | null;
  payload: Record<string, string>;
  createdAt: string;
};

export type FileStore = {
  indexer: IndexerStateRow;
  launches: PonsLaunchRow[];
  events: PonsEventRow[];
};

export type Store = {
  engine: string;
  getIndexer(): IndexerStateRow;
  setIndexer(row: IndexerStateRow): void;
  upsertLaunches(rows: PonsLaunchRow[]): void;
  updateLaunch(tokenAddress: string, patch: Partial<PonsLaunchRow>): void;
  allLaunches(): PonsLaunchRow[];
  upsertEvents(rows: PonsEventRow[]): void;
  eventsForActor(actor: string, limit?: number): PonsEventRow[];
};

export function emptyIndexer(startBlock: string): IndexerStateRow {
  return {
    lastIndexedBlock: startBlock,
    liveHeadBlock: "0",
    historicalBackfillBlock: startBlock,
    chainHead: null,
    lastSuccessAt: null,
    lastError: null,
    status: "idle",
    liveStatus: "idle",
    backfillStatus: "idle",
    startBlock,
    chunkSize: process.env.INDEXER_CHUNK?.trim() || "20000",
    blocksPerSecond: null,
    etaSeconds: null,
    provider: null,
  };
}

export function emptyLaunchFields(): Omit<
  PonsLaunchRow,
  | "tokenAddress"
  | "curveAddress"
  | "deployer"
  | "pairToken"
  | "launchConfigId"
  | "graduationThreshold"
  | "blockNumber"
  | "transactionHash"
  | "logIndex"
  | "createdAt"
> {
  return {
    phase: 0,
    state: "CURVE",
    creatorFeeRecipient: null,
    poolFee: null,
    tickSpacing: null,
    creatorTaxBps: null,
    buybackEnabled: null,
    sweptQuote: null,
    sweptTokens: null,
    sweptAt: null,
    pairKind: null,
    pairSymbol: null,
    pairName: null,
    pairDecimals: null,
    pairLogoUrl: null,
    pairTicker: null,
    pairMultiplier: null,
    tokenName: null,
    tokenSymbol: null,
    tokenDecimals: null,
    tokenLogo: null,
    quoteReserve: null,
    tokenReserve: null,
    realQuoteReserve: null,
    sellableTokens: null,
    reservedTokens: null,
    readyToGraduate: null,
    graduated: null,
    feeBps: null,
    curveCreatorTaxBps: null,
    poolId: null,
    poolManager: null,
    enrichedAt: null,
    sanityError: null,
  };
}

export function migrateIndexer(raw: Partial<IndexerStateRow> | undefined, startBlock: string): IndexerStateRow {
  const base = emptyIndexer(startBlock);
  if (!raw) return base;
  const last = raw.lastIndexedBlock || startBlock;
  return {
    ...base,
    ...raw,
    lastIndexedBlock: last,
    liveHeadBlock: raw.liveHeadBlock ?? "0",
    historicalBackfillBlock: raw.historicalBackfillBlock || last,
    liveStatus: raw.liveStatus ?? raw.status ?? "idle",
    backfillStatus: raw.backfillStatus ?? raw.status ?? "idle",
    startBlock: raw.startBlock || startBlock,
    chunkSize: raw.chunkSize || base.chunkSize,
  };
}
