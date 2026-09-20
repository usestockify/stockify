import { NextResponse } from "next/server";
import { getRobinhoodAssets } from "@/lib/robinhood/assets";

export async function GET() {
  const result = await getRobinhoodAssets();
  const status = result.status === "error" && !result.data ? 502 : 200;
  return NextResponse.json(result, {
    status,
    headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=3600" },
  });
}
