import { NextResponse } from "next/server";
import { readUsdgs } from "@/lib/tokens/usdg";

export async function GET() {
  const result = await readUsdgs();
  const status = result.status === "error" && !result.data ? 502 : 200;
  return NextResponse.json(result, {
    status,
    headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
