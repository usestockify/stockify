import { NextResponse } from "next/server";
import { STOCKIFY_MARKETS } from "@/lib/markets";

export const dynamic = "force-dynamic";

/**
 * Embeddable SVG badges. Supply and burn figures stay unpublished until a
 * Vaultly token exists.
 */
const SLATE = "#000000";
const MINT = "#FFFFFF";
const FOG = "#F5F5F5";
const INK = "#000000";

const width = (text: string) => Math.ceil(text.length * 6.6) + 20;

function badge(label: string, value: string, accent: string) {
  const lw = width(label);
  const vw = width(value);
  const w = lw + vw;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="24" viewBox="0 0 ${w} 24" role="img" aria-label="${esc(label)}: ${esc(value)}">
  <title>${esc(label)}: ${esc(value)}</title>
  <rect width="${w}" height="24" rx="6" fill="${SLATE}"/>
  <rect x="${lw}" width="${vw}" height="24" rx="6" fill="${accent}"/>
  <rect x="${lw}" width="8" height="24" fill="${accent}"/>
  <g font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="11" letter-spacing="0.4">
    <text x="${lw / 2}" y="16" fill="${FOG}" text-anchor="middle">${esc(label)}</text>
    <text x="${lw + vw / 2}" y="16" fill="${INK}" text-anchor="middle" font-weight="bold">${esc(value)}</text>
  </g>
</svg>`;
}

export async function GET(_req: Request, ctx: { params: Promise<{ metric: string }> }) {
  const { metric } = await ctx.params;
  const key = metric.replace(/\.svg$/i, "").toLowerCase();
  const svg = (label: string, value: string, accent = MINT) =>
    new NextResponse(badge(label, value, accent), {
      headers: { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "public, max-age=300, s-maxage=300" },
    });

  if (key === "vaults") return svg("markets listed", String(STOCKIFY_MARKETS.length));
  if (key === "split") return svg("fee policy", "unpublished");
  if (key === "burned" || key === "supply" || key === "circulating") return svg("vaultly token", "unpublished");
  if (key === "checks") return svg("verified", "—");
  return svg("unknown badge", key.slice(0, 24), "#E8D9C4");
}
