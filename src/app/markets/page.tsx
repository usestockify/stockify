import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { VaultTable } from "@/components/vaults/VaultTable";
import { getT } from "@/i18n/server";
import { BRAND } from "@/lib/brand";
import "@/styles/vaults.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("nav");
  return { title: t("products.markets.label") };
}

export default function MarketsPage() {
  return (
    <main className="app-page">
      <SiteHeader />
      <div className="vaults-page vaults-directory masthead-page">
        <VaultTable variant="markets" />
      </div>
      <SiteFooter />
    </main>
  );
}
