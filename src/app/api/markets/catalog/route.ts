import { NextResponse } from "next/server";
import { getStockifyCatalog } from "@/lib/stockify/catalog";

export async function GET() {
  try {
    const result = await getStockifyCatalog();
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
