import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { MarketDesk } from "@/components/vaults/MarketDesk";
import { getT } from "@/i18n/server";
import { BRAND } from "@/lib/brand";
import { STOCKIFY_MARKETS, findMarket } from "@/lib/markets";
import "@/styles/vaults.css";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const market = findMarket(id);
  const t = await getT("vaults");
  return { title: market ? t("meta.vaultTitle", { symbol: market.symbol }) : BRAND.titleName };
}

export function generateStaticParams() {
  return STOCKIFY_MARKETS.map((m) => ({ id: m.slug }));
}

export default async function VaultPage({ params }: Params) {
  const { id } = await params;
  const market = findMarket(id);
  if (!market) notFound();
  return (
    <div className="app-page">
      <SiteHeader />
      <MarketDesk market={market} />
      <SiteFooter />
    </div>
  );
}
