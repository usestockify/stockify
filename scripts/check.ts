import { spawnSync } from "node:child_process";
import { PONS_V2, PONS_FACTORY_START_BLOCK } from "../src/lib/pons/config";
import { publicClient, ROBINHOOD_CHAIN_ID } from "../src/lib/chain";
import { getRobinhoodAssets } from "../src/lib/robinhood/assets";
import { readFactoryAnchors } from "../src/lib/pons/client";
import { indexerSnapshot } from "../src/server/indexer/pons";
import { initStore } from "../src/server/db/store";

type Row = { name: string; ok: boolean | "degraded"; detail: string };

function run(label: string, cmd: string, args: string[]): Row {
  const res = spawnSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32", cwd: process.cwd() });
  return { name: label, ok: res.status === 0, detail: res.status === 0 ? "PASS" : `exit ${res.status}` };
}

async function main() {
  const rows: Row[] = [];
  rows.push(run("TypeScript", "npx", ["tsc", "--noEmit"]));
  rows.push(run("Lint", "npx", ["next", "lint"]));
  const contracts = run("Contracts", "npx", ["hardhat", "test"]);
  rows.push({ name: "Tests", ok: contracts.ok, detail: contracts.detail });
  rows.push(contracts);
  rows.push(run("Build", "npx", ["next", "build"]));

  await initStore(PONS_FACTORY_START_BLOCK.toString()).catch(() => null);
  const client = publicClient();
  try {
    const block = await client.getBlockNumber();
    rows.push({ name: "RPC", ok: true, detail: `PASS · head ${block.toString()} · chain ${ROBINHOOD_CHAIN_ID}` });
  } catch (error) {
    rows.push({ name: "RPC", ok: "degraded", detail: error instanceof Error ? error.message : "RPC failed" });
  }
  try {
    const assets = await getRobinhoodAssets();
    rows.push({ name: "Robinhood API", ok: Boolean(assets.data?.length), detail: assets.data?.length ? `PASS · ${assets.data.length} assets` : assets.error ?? "FAIL" });
  } catch (error) {
    rows.push({ name: "Robinhood API", ok: false, detail: error instanceof Error ? error.message : "FAIL" });
  }
  try {
    const factory = await readFactoryAnchors();
    rows.push({ name: "PONS Factory", ok: Boolean(factory.data), detail: factory.data ? `PASS · ${PONS_V2.factory}` : factory.error ?? "FAIL" });
  } catch (error) {
    rows.push({ name: "PONS Factory", ok: false, detail: error instanceof Error ? error.message : "FAIL" });
  }
  const snap = indexerSnapshot();
  rows.push({ name: "Indexer", ok: snap.liveStatus !== "error", detail: snap.label });

  const line = (name: string) => {
    const row = rows.find((r) => r.name === name);
    if (!row) return "FAIL";
    if (row.ok === true) return "PASS";
    if (row.ok === "degraded") return "DEGRADED";
    return "FAIL";
  };

  console.log("");
  console.log("STOCKIFY CHECK");
  console.log("");
  console.log(`TypeScript: ${line("TypeScript")}`);
  console.log(`Lint: ${line("Lint")}`);
  console.log(`Tests: ${line("Tests")}`);
  console.log(`Contracts: ${line("Contracts")}`);
  console.log(`Build: ${line("Build")}`);
  console.log(`RPC: ${line("RPC")}`);
  console.log(`Robinhood API: ${line("Robinhood API")}`);
  console.log(`PONS Factory: ${line("PONS Factory")}`);
  console.log(`Indexer: ${snap.label}`);
  console.log("");

  const hardFail = rows.some((r) => ["TypeScript", "Lint", "Build"].includes(r.name) && r.ok === false);
  process.exit(hardFail ? 1 : 0);
}

void main();
