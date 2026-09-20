import { tickIndexer, indexerSnapshot } from "../src/server/indexer/pons";
import { ensureDataDir, initStore } from "../src/server/db/store";
import { PONS_FACTORY_START_BLOCK } from "../src/lib/pons/config";

async function main() {
  ensureDataDir();
  await initStore(PONS_FACTORY_START_BLOCK.toString());
  for (;;) {
    const result = await tickIndexer({ maxChunks: 12, budgetMs: 25_000, enrich: 20 });
    const snap = indexerSnapshot();
    console.log(
      JSON.stringify({
        label: snap.label,
        live: result.indexed.liveHeadBlock,
        backfill: result.indexed.historicalBackfillBlock,
        chainHead: result.indexed.chainHead,
        blocksPerSecond: result.indexed.blocksPerSecond,
        etaSeconds: result.indexed.etaSeconds,
        chunks: result.chunks,
        launchesAdded: result.launchesAdded,
        engine: result.engine,
        provider: result.indexed.provider,
        error: result.indexed.lastError,
      }),
    );
    const delay = snap.liveStatus === "caught-up" && snap.backfillStatus === "caught-up" ? 12_000 : 750;
    await new Promise((r) => setTimeout(r, delay));
  }
}

void main();
