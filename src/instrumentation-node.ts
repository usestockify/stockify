import { ensureDataDir, initStore } from "@/server/db/store";
import { PONS_FACTORY_START_BLOCK } from "@/lib/pons/config";

ensureDataDir();

const START = PONS_FACTORY_START_BLOCK.toString();

function startBackgroundIndexers() {
  if (process.env.STOCKIFY_INDEXER_EXTERNAL === "1") return;
  void initStore(START)
    .catch(() => null)
    .then(async () => {
      const [{ startIndexerLoop }, { startStockifyIndexerLoop }] = await Promise.all([
        import("@/server/indexer/pons"),
        import("@/server/indexer/stockify"),
      ]);
      startIndexerLoop();
      startStockifyIndexerLoop();
    });
}

void initStore(START).catch(() => null);
setTimeout(startBackgroundIndexers, 8_000);
