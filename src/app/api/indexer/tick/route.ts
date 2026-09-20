import { NextResponse } from "next/server";
import { indexerSnapshot, tickIndexer } from "@/server/indexer/pons";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ status: "ready", data: indexerSnapshot() }, { headers: { "cache-control": "no-store" } });
}

export async function POST() {
  const result = await tickIndexer({ maxChunks: 8, budgetMs: 20_000, enrich: 16 });
  return NextResponse.json({ status: "ready", data: result }, { headers: { "cache-control": "no-store" } });
}
