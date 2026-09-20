import { ensureDataDir, initStore } from "@/server/db/store";
import { startIndexerLoop } from "@/server/indexer/pons";
import { PONS_FACTORY_START_BLOCK } from "@/lib/pons/config";

ensureDataDir();
void initStore(PONS_FACTORY_START_BLOCK.toString()).catch(() => null);
if (process.env.STOCKIFY_INDEXER_EXTERNAL !== "1") {
  void initStore(PONS_FACTORY_START_BLOCK.toString())
    .catch(() => null)
    .then(() => startIndexerLoop());
}
