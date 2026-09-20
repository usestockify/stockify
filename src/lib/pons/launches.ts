import { getAddress, zeroAddress, type Address, type PublicClient } from "viem";
import { publicClient, ZERO_ADDRESS } from "@/lib/chain";
import { failed, ready, type DataEnvelope } from "@/lib/data";
import { getRobinhoodAssets } from "@/lib/robinhood/assets";
import { USDG_ADDRESS } from "@/lib/tokens/usdg";
import { readErc20 } from "@/lib/tokens/erc20";
import { ponsBondingCurveAbi, ponsLaunchFactoryAbi, ponsLaunchTokenAbi } from "./abis";
import { PONS_PHASE, PONS_V2, type PonsLaunch, type PonsPairAsset, type PonsPairKind } from "./config";
import { getTokenLaunchedEvents, type TokenLaunchedEvent } from "./events";

async function resolvePair(pairToken: Address, client: PublicClient): Promise<PonsPairAsset> {
  if (pairToken === ZERO_ADDRESS || pairToken === zeroAddress) {
    return { address: ZERO_ADDRESS, kind: "eth", native: true, symbol: "ETH", name: "Ether", decimals: 18 };
  }
  const addr = getAddress(pairToken);
  if (addr.toLowerCase() === USDG_ADDRESS.toLowerCase()) {
    const meta = await readErc20(addr, client);
    return {
      address: addr,
      kind: "usdg",
      native: false,
      symbol: meta.data?.symbol ?? "USDG",
      name: meta.data?.name ?? "Global Dollar",
      decimals: meta.data?.decimals ?? null,
    };
  }
  const assets = await getRobinhoodAssets();
  const stock = assets.data?.find((a) => a.chain4663?.contractAddress.toLowerCase() === addr.toLowerCase());
  const kind: PonsPairKind = stock ? "stock-token" : "other";
  const meta = await readErc20(addr, client);
  return {
    address: addr,
    kind,
    native: false,
    symbol: meta.data?.symbol ?? stock?.tokenSymbol ?? null,
    name: meta.data?.name ?? stock?.tokenName ?? null,
    decimals: meta.data?.decimals ?? null,
  };
}

export async function readCurve(curve: Address, client: PublicClient): Promise<PonsLaunch["curveLive"]> {
  try {
    const [graduated, quoteReserve, tokenReserve, sellable, readyToGraduate, feeBps, creatorTaxBps] = await Promise.all([
      client.readContract({ address: curve, abi: ponsBondingCurveAbi, functionName: "graduated" }),
      client.readContract({ address: curve, abi: ponsBondingCurveAbi, functionName: "quoteReserve" }),
      client.readContract({ address: curve, abi: ponsBondingCurveAbi, functionName: "tokenReserve" }),
      client.readContract({ address: curve, abi: ponsBondingCurveAbi, functionName: "sellableTokens" }),
      client.readContract({ address: curve, abi: ponsBondingCurveAbi, functionName: "readyToGraduate" }),
      client.readContract({ address: curve, abi: ponsBondingCurveAbi, functionName: "feeBps" }),
      client.readContract({ address: curve, abi: ponsBondingCurveAbi, functionName: "creatorTaxBps" }),
    ]);
    return {
      graduated,
      quoteReserve: quoteReserve.toString(),
      tokenReserve: tokenReserve.toString(),
      sellableTokens: sellable.toString(),
      readyToGraduate,
      feeBps: feeBps.toString(),
      creatorTaxBps: creatorTaxBps.toString(),
    };
  } catch {
    return null;
  }
}

async function readMetadata(token: Address, client: PublicClient) {
  try {
    const [name, symbol, decimals, logo, description] = await Promise.all([
      client.readContract({ address: token, abi: ponsLaunchTokenAbi, functionName: "name" }),
      client.readContract({ address: token, abi: ponsLaunchTokenAbi, functionName: "symbol" }),
      client.readContract({ address: token, abi: ponsLaunchTokenAbi, functionName: "decimals" }),
      client.readContract({ address: token, abi: ponsLaunchTokenAbi, functionName: "tokenLogo" }).catch(() => null),
      client.readContract({ address: token, abi: ponsLaunchTokenAbi, functionName: "tokenDescription" }).catch(() => null),
    ]);
    return {
      name,
      symbol,
      decimals: Number(decimals),
      logo: logo || null,
      description: description || null,
    };
  } catch {
    return { name: null, symbol: null, decimals: null, logo: null, description: null };
  }
}

export async function resolveLaunch(token: Address, launchEvent?: TokenLaunchedEvent, client: PublicClient = publicClient()): Promise<DataEnvelope<PonsLaunch>> {
  try {
    const row = await client.readContract({
      address: PONS_V2.factory,
      abi: ponsLaunchFactoryAbi,
      functionName: "getLaunchedToken",
      args: [token],
    });
    if (!row.exists) return failed("Launch not found on the PONS factory");
    const [pair, metadata, curveLive] = await Promise.all([
      resolvePair(row.pairToken, client),
      readMetadata(row.token, client),
      readCurve(row.curve, client),
    ]);
    const phase = Number(row.phase);
    return ready({
      token: row.token,
      curve: row.curve,
      deployer: row.deployer,
      creatorFeeRecipient: row.creatorFeeRecipient,
      pair,
      graduationThreshold: row.graduationThreshold.toString(),
      poolFee: Number(row.poolFee),
      tickSpacing: Number(row.tickSpacing),
      creatorTaxBps: Number(row.creatorTaxBps),
      buybackEnabled: row.buybackEnabled,
      state: PONS_PHASE[phase] ?? "unknown",
      phase,
      sweptQuote: row.sweptQuote.toString(),
      sweptTokens: row.sweptTokens.toString(),
      sweptAt: row.sweptAt.toString(),
      exists: row.exists,
      launchConfigId: launchEvent?.launchConfigId ?? null,
      metadata,
      curveLive,
    });
  } catch (error) {
    return failed(error instanceof Error ? error.message : "Launch could not be resolved");
  }
}

export async function getPonsLaunches(): Promise<DataEnvelope<PonsLaunch[]>> {
  const events = await getTokenLaunchedEvents();
  if (!events.data) return { status: events.status, data: null, error: events.error, fetchedAt: events.fetchedAt };
  const client = publicClient();
  const seen = new Set<string>();
  const launches: PonsLaunch[] = [];
  const errors: string[] = [];
  for (const event of events.data) {
    const key = event.token.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const resolved = await resolveLaunch(event.token, event, client);
    if (resolved.data) launches.push(resolved.data);
    else if (resolved.error) errors.push(`${event.token}: ${resolved.error}`);
  }
  if (!launches.length && errors.length) return failed(errors.slice(0, 3).join("; "));
  return ready(launches, events.fetchedAt);
}

export function stockifyRelevantLaunches(launches: PonsLaunch[]) {
  return launches.filter((l) => l.pair.kind === "usdg" || l.pair.kind === "stock-token");
}
