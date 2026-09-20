import { NextResponse } from "next/server";
import { getRobinhoodPrice } from "@/lib/robinhood/prices";

type Params = { params: Promise<{ symbol: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { symbol } = await params;
  if (!/^[A-Za-z0-9.]{1,12}$/.test(symbol)) {
    return NextResponse.json({ status: "unavailable", data: null, error: "Invalid symbol" }, { status: 400 });
  }
  const result = await getRobinhoodPrice(symbol);
  const status = result.status === "error" && !result.data ? 502 : 200;
  return NextResponse.json(result, {
    status,
    headers: { "cache-control": "public, s-maxage=15, stale-while-revalidate=60" },
  });
}
