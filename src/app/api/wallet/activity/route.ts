import { isAddress } from "viem";
import { NextResponse } from "next/server";
import { loadIndexedActivity } from "@/lib/wallet/activity";

export async function GET(req: Request) {
  const owner = new URL(req.url).searchParams.get("owner") ?? "";
  if (!isAddress(owner)) {
    return NextResponse.json({ status: "unavailable", data: null, error: "wallet required" }, { status: 400 });
  }
  try {
    const packed = await loadIndexedActivity(owner);
    if (packed == null) {
      return NextResponse.json({ status: "unavailable", data: null, error: "Indexed activity is not available" }, { headers: { "cache-control": "no-store" } });
    }
    return NextResponse.json(
      { status: "ready", data: packed.rows, source: packed.source, scope: packed.scope },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ status: "unavailable", data: [], error: "indexer offline" }, { headers: { "cache-control": "no-store" } });
  }
}
