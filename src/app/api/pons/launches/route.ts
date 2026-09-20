import { NextResponse } from "next/server";
import { getPonsLaunches, stockifyRelevantLaunches } from "@/lib/pons/launches";

export async function GET(req: Request) {
  const relevant = new URL(req.url).searchParams.get("relevant") === "1";
  const result = await getPonsLaunches();
  if (!result.data) {
    return NextResponse.json(result, {
      status: result.status === "error" ? 502 : 200,
      headers: { "cache-control": "public, s-maxage=30, stale-while-revalidate=120" },
    });
  }
  const data = relevant ? stockifyRelevantLaunches(result.data) : result.data;
  return NextResponse.json(
    { ...result, data },
    { headers: { "cache-control": "public, s-maxage=30, stale-while-revalidate=120" } },
  );
}
