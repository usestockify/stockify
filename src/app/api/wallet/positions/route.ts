import { isAddress } from "viem";
import { NextResponse } from "next/server";
import { readWalletPositions } from "@/lib/wallet/positions";

export async function GET(req: Request) {
  const owner = new URL(req.url).searchParams.get("owner") ?? "";
  if (!isAddress(owner)) {
    return NextResponse.json({ status: "unavailable", data: null, error: "wallet required" }, { status: 400 });
  }
  try {
    const data = await readWalletPositions(owner);
    return NextResponse.json({ status: "ready", data, fetchedAt: new Date().toISOString() }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      { status: "error", data: null, error: error instanceof Error ? error.message : "Positions unavailable" },
      { status: 502 },
    );
  }
}
