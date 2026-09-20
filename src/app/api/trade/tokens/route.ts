import { NextResponse } from "next/server";
import { getTradeTokens } from "@/lib/trade-tokens";

export async function GET() {
  try {
    const data = await getTradeTokens();
    return NextResponse.json(
      { status: "ready", data, fetchedAt: new Date().toISOString() },
      { headers: { "cache-control": "public, s-maxage=30, stale-while-revalidate=120" } },
    );
  } catch (error) {
    return NextResponse.json(
      { status: "error", data: null, error: error instanceof Error ? error.message : "Trade tokens unavailable" },
      { status: 502 },
    );
  }
}
