import { NextResponse } from "next/server";
import { indexerSnapshot, tickIndexer } from "@/server/indexer/pons";
import { stockifySnapshot, tickStockifyIndexer } from "@/server/indexer/stockify";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ status: "ready", data: { pons: indexerSnapshot(), stockify: stockifySnapshot() } }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ status: "unavailable", data: null, error: "indexer offline" }, { headers: { "cache-control": "no-store" } });
  }
}

export async function POST() {
  try {
    const result = await tickIndexer({ maxChunks: 8, budgetMs: 20_000, enrich: 16 });
    const stockify = await tickStockifyIndexer();
    return NextResponse.json({ status: "ready", data: { ...result, stockify } }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ status: "unavailable", data: null, error: "indexer offline" }, { headers: { "cache-control": "no-store" } });
  }
}
