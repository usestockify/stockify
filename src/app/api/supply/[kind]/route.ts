import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Plain-text supply endpoints. Unpublished until a Vaultly token exists.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ kind: string }> }) {
  const { kind } = await ctx.params;
  const known = ["max", "burned", "total", "circulating"];
  if (!known.includes(kind)) return new NextResponse("Unknown supply kind", { status: 404 });
  return new NextResponse("unpublished", {
    status: 503,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=60" },
  });
}
