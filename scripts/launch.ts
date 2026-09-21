import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  createPublicClient,
  createWalletClient,
  decodeEventLog,
  encodeDeployData,
  http,
  parseAbi,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { robinhoodChain, ROBINHOOD_CHAIN_ID, USDG_ADDRESS, ZERO_ADDRESS } from "../src/lib/chain";
import { STOCKIFY_WATCHLIST } from "../src/lib/markets";
import { ROBINHOOD_ASSETS_URL } from "../src/lib/robinhood/types";
import { CHAINLINK_FEEDS_URL, UNISWAP_ROBINHOOD, UNISWAP_V3_FEE_TIERS } from "../src/config/uniswap-robinhood";

type MarketPlan = {
  ticker: string;
  stock: Address;
  name: string;
  status: string;
  feed: Address;
  heartbeat: number;
  pool: Address | null;
  fee: number;
  tickSpacing: number;
  vaultName: string;
  shareSymbol: string;
};

type Manifest = {
  chainId: number;
  deploymentBlock: string;
  USDG: Address;
  registry: Address;
  oracle: Address;
  router: Address;
  vaultFactory: Address;
  strategyFactory: Address;
  uniswap: typeof UNISWAP_ROBINHOOD;
  markets: Record<
    string,
    { stockToken: Address; vault: Address; strategy: Address; pool: Address | null; feed: Address; fee: number; deploymentTx: Hex }
  >;
  verification: Record<string, string>;
};

const TICKERS = [...STOCKIFY_WATCHLIST];
const ART = join(process.cwd(), ".data/hardhat-artifacts/contracts/protocol");
const OUT = join(process.cwd(), "src/config/deployments/robinhood-mainnet.json");
const erc20 = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
]);
const factoryAbi = parseAbi(["function getPool(address,address,uint24) view returns (address)", "function feeAmountTickSpacing(uint24) view returns (int24)"]);
const feedAbi = parseAbi([
  "function decimals() view returns (uint8)",
  "function latestRoundData() view returns (uint80,int256,uint256,uint256,uint80)",
]);
const v3poolAbi = parseAbi(["function token0() view returns (address)", "function token1() view returns (address)", "function fee() view returns (uint24)", "function tickSpacing() view returns (int24)", "function slot0() view returns (uint160,int24,uint16,uint16,uint16,uint8,bool)"]);

function rpcUrl() {
  return (
    process.env.RH_ARCHIVE_RPC_URL?.trim() ||
    process.env.RH_RPC_URL?.trim() ||
    process.env.RPC_URL?.trim() ||
    process.env.NEXT_PUBLIC_RPC_URL?.trim() ||
    "https://rpc.mainnet.chain.robinhood.com"
  );
}

function client() {
  return createPublicClient({ chain: robinhoodChain, transport: http(rpcUrl(), { timeout: 30_000 }) });
}

function artifact(file: string, name: string) {
  const path = join(ART, file, `${name}.json`);
  if (!existsSync(path)) throw new Error(`Missing artifact ${path}. Compile first.`);
  return JSON.parse(readFileSync(path, "utf8")) as { abi: unknown; bytecode: Hex };
}

function run(cmd: string) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: process.cwd(), env: process.env, shell: process.platform === "win32" });
}

async function code(address: Address) {
  const c = await client().getBytecode({ address });
  return Boolean(c && c !== "0x");
}

async function preflight(): Promise<MarketPlan[]> {
  const c = client();
  const chainId = await c.getChainId();
  if (chainId !== ROBINHOOD_CHAIN_ID) throw new Error(`RPC chainId ${chainId} !== ${ROBINHOOD_CHAIN_ID}`);

  const usdgCode = await code(USDG_ADDRESS);
  if (!usdgCode) throw new Error("USDG has no bytecode");
  const [usdgName, usdgSymbol, usdgDec] = await Promise.all([
    c.readContract({ address: USDG_ADDRESS, abi: erc20, functionName: "name" }),
    c.readContract({ address: USDG_ADDRESS, abi: erc20, functionName: "symbol" }),
    c.readContract({ address: USDG_ADDRESS, abi: erc20, functionName: "decimals" }),
  ]);
  console.log(`USDG ${usdgName} ${usdgSymbol} decimals=${usdgDec}`);

  for (const [label, addr] of Object.entries({
    v3Factory: UNISWAP_ROBINHOOD.v3Factory,
    npm: UNISWAP_ROBINHOOD.positionManager,
    router: UNISWAP_ROBINHOOD.swapRouter02,
    v4: UNISWAP_ROBINHOOD.v4PoolManager,
  })) {
    if (!(await code(addr as Address))) throw new Error(`${label} ${addr} has no bytecode — not inventing Uniswap addresses`);
  }

  const assetsRes = await fetch(ROBINHOOD_ASSETS_URL, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(20_000) });
  if (!assetsRes.ok) throw new Error(`Robinhood assets HTTP ${assetsRes.status}`);
  const assetsJson = (await assetsRes.json()) as { assets?: Array<Record<string, unknown>> };
  const feedsRes = await fetch(CHAINLINK_FEEDS_URL, { signal: AbortSignal.timeout(20_000) });
  if (!feedsRes.ok) throw new Error(`Chainlink feeds HTTP ${feedsRes.status}`);
  const feedsJson = (await feedsRes.json()) as Array<{ proxyAddress?: string; heartbeat?: number; docs?: { baseAsset?: string } }>;

  const blockers: string[] = [];
  const plans: MarketPlan[] = [];

  for (const ticker of TICKERS) {
    const asset = (assetsJson.assets ?? []).find((a) => String(a.tokenSymbol).toUpperCase() === ticker);
    if (!asset) {
      blockers.push(`${ticker}: missing from Robinhood asset registry`);
      continue;
    }
    if (String(asset.status) !== "ASSET_STATUS_ACTIVE") {
      blockers.push(`${ticker}: status ${asset.status} !== ASSET_STATUS_ACTIVE`);
    }
    const dep = (Array.isArray(asset.deployments) ? asset.deployments : []).find((d) => Number((d as { chainId?: number }).chainId) === 4663) as
      | { contractAddress?: string }
      | undefined;
    const stock = dep?.contractAddress as Address | undefined;
    if (!stock) {
      blockers.push(`${ticker}: no chainId 4663 deployment`);
      continue;
    }
    if (!(await code(stock))) blockers.push(`${ticker}: stock token ${stock} has no bytecode`);
    const feedRow = feedsJson.find((f) => f.docs?.baseAsset === ticker);
    if (!feedRow?.proxyAddress) {
      blockers.push(`${ticker}: no Chainlink proxy in official directory`);
      continue;
    }
    const feed = feedRow.proxyAddress as Address;
    if (!(await code(feed))) blockers.push(`${ticker}: feed ${feed} has no bytecode`);
    try {
      const round = await c.readContract({ address: feed, abi: feedAbi, functionName: "latestRoundData" });
      if (round[1] <= 0n) blockers.push(`${ticker}: feed answer <= 0`);
    } catch (e) {
      blockers.push(`${ticker}: feed latestRoundData failed (${e instanceof Error ? e.message : e})`);
    }

    let pool: Address | null = null;
    let fee = 3000;
    let tickSpacing = 60;
    for (const f of UNISWAP_V3_FEE_TIERS) {
      const found = (await c.readContract({
        address: UNISWAP_ROBINHOOD.v3Factory,
        abi: factoryAbi,
        functionName: "getPool",
        args: [stock, USDG_ADDRESS, f],
      })) as Address;
      const spacing = (await c.readContract({
        address: UNISWAP_ROBINHOOD.v3Factory,
        abi: factoryAbi,
        functionName: "feeAmountTickSpacing",
        args: [f],
      })) as number;
      if (found !== ZERO_ADDRESS && (await code(found))) {
        const liqSlot = await c.readContract({ address: found, abi: v3poolAbi, functionName: "slot0" }).catch(() => null);
        pool = found;
        fee = f;
        tickSpacing = Number(spacing);
        if (liqSlot) break;
      } else if (!pool && Number(spacing) > 0) {
        fee = f;
        tickSpacing = Number(spacing);
      }
    }
    const spacingOk = await c.readContract({
      address: UNISWAP_ROBINHOOD.v3Factory,
      abi: factoryAbi,
      functionName: "feeAmountTickSpacing",
      args: [fee],
    });
    if (!spacingOk) blockers.push(`${ticker}: fee ${fee} is not enabled on the verified V3 factory`);

    plans.push({
      ticker,
      stock,
      name: String(asset.tokenName || ticker),
      status: String(asset.status),
      feed,
      heartbeat: feedRow.heartbeat || 86400,
      pool,
      fee,
      tickSpacing,
      vaultName: `Vaultly ${ticker} Vault`,
      shareSymbol: `st${ticker}`,
    });
  }

  if (blockers.length) {
    console.error("\nPREFLIGHT BLOCKERS");
    for (const b of blockers) console.error(` - ${b}`);
    throw new Error(`Preflight failed for ${blockers.length} check(s). No mainnet transactions were sent.`);
  }
  if (plans.length !== 11) throw new Error(`Expected 11 markets, planned ${plans.length}`);
  console.log("\nPREFLIGHT OK — 11 / 11 markets");
  for (const p of plans) {
    console.log(` ${p.ticker} stock=${p.stock} feed=${p.feed} pool=${p.pool ?? "will create via verified factory"} fee=${p.fee} spacing=${p.tickSpacing}`);
  }
  return plans;
}

async function deploy(plans: MarketPlan[]): Promise<Manifest> {
  const pk = (process.env.STOCKIFY_DEPLOYER_KEY || process.env.PRIVATE_KEY || "").trim();
  if (!pk) throw new Error("Signer missing. Set STOCKIFY_DEPLOYER_KEY (never committed).");
  const key = (pk.startsWith("0x") ? pk : `0x${pk}`) as Hex;
  const account = privateKeyToAccount(key);
  const pub = client();
  const wallet = createWalletClient({ account, chain: robinhoodChain, transport: http(rpcUrl(), { timeout: 60_000 }) });
  const send = async (file: string, name: string, args: unknown[]) => {
    const art = artifact(file, name);
    const hash = await wallet.deployContract({ abi: art.abi as never, bytecode: art.bytecode, args: args as never, account, chain: robinhoodChain });
    const rec = await pub.waitForTransactionReceipt({ hash });
    if (rec.status !== "success" || !rec.contractAddress) throw new Error(`${name} deploy failed ${hash}`);
    console.log(`deployed ${name} ${rec.contractAddress} tx=${hash}`);
    return { address: rec.contractAddress as Address, hash, block: rec.blockNumber };
  };
  const write = async (address: Address, file: string, name: string, functionName: string, args: unknown[]) => {
    const art = artifact(file, name);
    const hash = await wallet.writeContract({ address, abi: art.abi as never, functionName, args: args as never, account, chain: robinhoodChain });
    const rec = await pub.waitForTransactionReceipt({ hash });
    if (rec.status !== "success") throw new Error(`${name}.${functionName} failed ${hash}`);
    return rec;
  };

  const oracle = await send("OracleAdapter.sol", "OracleAdapter", [USDG_ADDRESS, account.address]);
  const registry = await send("StockRegistry.sol", "StockRegistry", [USDG_ADDRESS, account.address]);
  const vaultFactory = await send("Factories.sol", "StockifyVaultFactory", [USDG_ADDRESS, account.address]);
  const stratFactory = await send("Factories.sol", "StockifyStrategyFactory", [
    USDG_ADDRESS,
    oracle.address,
    UNISWAP_ROBINHOOD.v3Factory,
    UNISWAP_ROBINHOOD.positionManager,
    UNISWAP_ROBINHOOD.swapRouter02,
    account.address,
  ]);
  const router = await send("StockifyRouter.sol", "StockifyRouter", [USDG_ADDRESS, registry.address]);

  const usdgFeed = plans[0] && (await fetch(CHAINLINK_FEEDS_URL).then((r) => r.json())) as Array<{ proxyAddress?: string; heartbeat?: number; docs?: { baseAsset?: string } }>;
  const usdgRow = usdgFeed.find((f) => f.docs?.baseAsset === "USDG");
  if (!usdgRow?.proxyAddress) throw new Error("USDG Chainlink feed missing");
  await write(oracle.address, "OracleAdapter.sol", "OracleAdapter", "setUsdgFeed", [usdgRow.proxyAddress, usdgRow.heartbeat || 86400]);

  const markets: Manifest["markets"] = {};
  let deploymentBlock = oracle.block;
  for (const plan of plans) {
    await write(oracle.address, "OracleAdapter.sol", "OracleAdapter", "setFeed", [plan.stock, plan.feed, plan.heartbeat]);
    const created = await write(vaultFactory.address, "Factories.sol", "StockifyVaultFactory", "createVault", [
      plan.stock,
      plan.ticker,
      plan.vaultName,
      plan.shareSymbol,
    ]);
    const vaultLog = created.logs.find((l) => l.address.toLowerCase() === vaultFactory.address.toLowerCase());
    if (!vaultLog) throw new Error(`${plan.ticker} VaultCreated log missing — stopping to avoid inconsistent state`);
    const decoded = decodeEventLog({
      abi: artifact("Factories.sol", "StockifyVaultFactory").abi as never,
      data: vaultLog.data,
      topics: vaultLog.topics,
    });
    const vault = (decoded.args as { vault: Address }).vault;
    const stratTx = await write(stratFactory.address, "Factories.sol", "StockifyStrategyFactory", "createStrategy", [
      vault,
      plan.stock,
      plan.fee,
      2000,
    ]);
    const stratLog = stratTx.logs.find((l) => l.address.toLowerCase() === stratFactory.address.toLowerCase());
    if (!stratLog) throw new Error(`${plan.ticker} StrategyDeployed log missing — stopping`);
    const stratDecoded = decodeEventLog({
      abi: artifact("Factories.sol", "StockifyStrategyFactory").abi as never,
      data: stratLog.data,
      topics: stratLog.topics,
    });
    const strategy = (stratDecoded.args as { strategy: Address }).strategy;
    const pool = ((stratDecoded.args as { pool?: Address }).pool ?? plan.pool ?? ZERO_ADDRESS) as Address;
    await write(vault, "StockifyVault.sol", "StockifyVault", "bindStrategy", [strategy]);
    await write(registry.address, "StockRegistry.sol", "StockRegistry", "register", [plan.ticker, plan.stock, vault, strategy]);
    markets[plan.ticker] = {
      stockToken: plan.stock,
      vault,
      strategy,
      pool: pool === ZERO_ADDRESS ? plan.pool : pool,
      feed: plan.feed,
      fee: plan.fee,
      deploymentTx: stratTx.transactionHash,
    };
    deploymentBlock = stratTx.blockNumber;
    console.log(`${plan.ticker} vault=${vault} strategy=${strategy}`);
  }

  const manifest: Manifest = {
    chainId: ROBINHOOD_CHAIN_ID,
    deploymentBlock: deploymentBlock.toString(),
    USDG: USDG_ADDRESS,
    registry: registry.address,
    oracle: oracle.address,
    router: router.address,
    vaultFactory: vaultFactory.address,
    strategyFactory: stratFactory.address,
    uniswap: UNISWAP_ROBINHOOD,
    markets,
    verification: {},
  };
  mkdirSync(join(process.cwd(), "src/config/deployments"), { recursive: true });
  writeFileSync(OUT, JSON.stringify(manifest, null, 2));
  console.log(`wrote ${OUT}`);
  return manifest;
}

async function smoke(manifest: Manifest) {
  const c = client();
  const vaultAbi = parseAbi(["function totalAssets() view returns (uint256)", "function stock() view returns (address)", "function strategy() view returns (address)"]);
  const oracleAbi = parseAbi(["function isFresh(address) view returns (bool)"]);
  let ok = 0;
  for (const [ticker, m] of Object.entries(manifest.markets)) {
    await c.readContract({ address: m.vault, abi: vaultAbi, functionName: "totalAssets" });
    await c.readContract({ address: m.vault, abi: vaultAbi, functionName: "strategy" });
    await c.readContract({ address: manifest.oracle, abi: oracleAbi, functionName: "isFresh", args: [m.stockToken] });
    ok += 1;
    console.log(`smoke ${ticker} ok`);
  }
  if (ok !== 11) throw new Error(`Smoke ${ok}/11`);
}

function loadDotEnv() {
  const file = join(process.cwd(), ".env");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 0) continue;
    const key = trimmed.slice(0, i).trim();
    let value = trimmed.slice(i + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

async function verifyContracts(manifest: Manifest) {
  const explorer = "https://robinhoodchain.blockscout.com";
  const status: Record<string, string> = {};
  const targets: Array<[string, Address]> = [
    ["oracle", manifest.oracle],
    ["registry", manifest.registry],
    ["vaultFactory", manifest.vaultFactory],
    ["strategyFactory", manifest.strategyFactory],
    ["router", manifest.router],
    ...Object.entries(manifest.markets).flatMap(([ticker, m]) => [
      [`${ticker}.vault`, m.vault] as [string, Address],
      [`${ticker}.strategy`, m.strategy] as [string, Address],
    ]),
  ];
  const buildInfoDir = join(process.cwd(), ".data/hardhat-artifacts/build-info");
  let standardJson: unknown = null;
  if (existsSync(buildInfoDir)) {
    const files = readdirSync(buildInfoDir).filter((f) => f.endsWith(".json"));
    if (files[0]) {
      const info = JSON.parse(readFileSync(join(buildInfoDir, files[0]), "utf8")) as { input?: unknown };
      standardJson = info.input ?? null;
    }
  }
  for (const [name, address] of targets) {
    try {
      const res = await fetch(`${explorer}/api/v2/smart-contracts/${address}/verification/via/standard-input`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          compiler_version: "v0.8.24+commit.e11b9ed9",
          license_type: "mit",
          contract_name: name,
          autodetect_constructor_args: true,
          compiler_settings: standardJson,
        }),
        signal: AbortSignal.timeout(20_000),
      });
      status[name] = res.ok ? `submitted ${res.status}` : `failed HTTP ${res.status}`;
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        status[name] = `failed HTTP ${res.status}${text ? `: ${text.slice(0, 160)}` : ""}`;
      }
    } catch (error) {
      status[name] = `failed: ${error instanceof Error ? error.message : "unknown"}`;
    }
  }
  manifest.verification = status;
  writeFileSync(OUT, JSON.stringify(manifest, null, 2));
  const failed = Object.values(status).filter((s) => s.startsWith("failed"));
  if (failed.length) console.error(`Explorer verification incomplete (${failed.length} failures). Status saved to manifest.`);
  else console.log("Explorer verification submitted for all contracts.");
}

async function estimateDeployGas() {
  const art = artifact("OracleAdapter.sol", "OracleAdapter");
  const c = client();
  const data = encodeDeployData({
    abi: art.abi as never,
    bytecode: art.bytecode,
    args: [USDG_ADDRESS, "0x0000000000000000000000000000000000000001"],
  });
  const gas = await c.estimateGas({ data });
  console.log(`gas estimate OracleAdapter deploy ≈ ${gas.toString()}`);
}

async function main() {
  loadDotEnv();
  const deployYes = process.env.STOCKIFY_MAINNET_DEPLOY === "YES";
  run("npx hardhat compile --config hardhat.config.cjs");
  run("npx hardhat test --config hardhat.config.cjs");
  run("npx tsc --noEmit");
  run("npx next lint");
  const plans = await preflight();
  await estimateDeployGas();
  mkdirSync(join(process.cwd(), "src/config/deployments"), { recursive: true });
  if (!deployYes) {
    console.log("\nDRY-RUN ONLY. Set STOCKIFY_MAINNET_DEPLOY=YES to broadcast.");
    const current = existsSync(OUT) ? (JSON.parse(readFileSync(OUT, "utf8")) as Manifest) : null;
    if (!current || !current.markets || Object.keys(current.markets).length === 0) {
      writeFileSync(
        OUT,
        JSON.stringify(
          {
            chainId: ROBINHOOD_CHAIN_ID,
            deploymentBlock: "0",
            USDG: USDG_ADDRESS,
            registry: ZERO_ADDRESS,
            oracle: ZERO_ADDRESS,
            router: ZERO_ADDRESS,
            vaultFactory: ZERO_ADDRESS,
            strategyFactory: ZERO_ADDRESS,
            uniswap: UNISWAP_ROBINHOOD,
            markets: {},
            verification: { status: "not-broadcast" },
            preflight: plans,
          },
          null,
          2,
        ),
      );
    }
    run("npx next build");
    return;
  }
  const manifest = await deploy(plans);
  await smoke(manifest);
  await verifyContracts(manifest);
  run("npx next build");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
