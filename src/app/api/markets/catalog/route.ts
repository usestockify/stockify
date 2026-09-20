import { NextResponse } from "next/server";
import { failed, withTimeout } from "@/lib/data";
import { getStockifyCatalog } from "@/lib/stockify/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await withTimeout(getStockifyCatalog(), 4_000, failed("catalog timed out"));
    return NextResponse.json(result, {
      headers: { "cache-control": "public, s-maxage=20, stale-while-revalidate=60" },
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", data: null, error: error instanceof Error ? error.message : "Catalog unavailable" },
      { status: 502 },
    );
  }
}
