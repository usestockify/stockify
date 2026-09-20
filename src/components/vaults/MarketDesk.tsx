import Link from "next/link";
import { StockLogo } from "@/components/StockLogo";
import { BrandMark } from "@/components/BrandMark";
import { getT } from "@/i18n/server";
import { explorerToken } from "@/lib/chain";
import { formatPrice } from "@/lib/format";
import type { StockifyMarket } from "@/lib/markets";
import { getStockifyMarket } from "@/lib/stockify/catalog";
import "@/styles/market-desk.css";

export async function MarketDesk({ market }: { market: StockifyMarket }) {
  const t = await getT("vaults");
  const row = await getStockifyMarket(market.symbol);
  const bid = row?.price?.equity.bid != null ? Number(row.price.equity.bid) : null;
  const ask = row?.price?.equity.ask != null ? Number(row.price.equity.ask) : null;
  const generated = row?.price?.equity.generatedAt;
  const halted = row?.price?.equity.isTradingHalt;
  return (
    <div className="vaults-page vaults-directory masthead-page">
      <section className="masthead masthead-1120 masthead-bleed">
        <div className="masthead-inner">
          <div className="masthead-head">
            <div className="masthead-title">
              <p className="eyebrow">
                <Link href="/vaults">{t("desk.back")}</Link>
              </p>
              <h1>
                <span className="vault-desk-identity">
                  <StockLogo symbol={market.symbol} logoUrl={row?.logoUrl} size={44} />
                  {row?.name ?? market.symbol}
                </span>
              </h1>
            </div>
            <p className="masthead-intro">{t("desk.intro", { symbol: market.symbol })}</p>
          </div>
          <div className="mast-stats">
            <article>
              <span className="stat-label">{t("desk.position")}</span>
              <strong className="stat-value">—</strong>
              <span className="stat-note">{t("desk.awaiting")}</span>
            </article>
            <article>
              <span className="stat-label">{t("desk.range")}</span>
              <strong className="stat-value">—</strong>
              <span className="stat-note">{t("rangeStatus.none")}</span>
            </article>
            <article>
              <span className="stat-label">{t("desk.usdg")}</span>
              <strong className="stat-value">—</strong>
              <span className="stat-note">{t("desk.awaiting")}</span>
            </article>
            <article>
              <span className="stat-label">{t("desk.stock")}</span>
              <strong className="stat-value">—</strong>
              <span className="stat-note">{t("desk.awaiting")}</span>
            </article>
          </div>
        </div>
      </section>
      <div className="vault-desk-body">
        <BrandMark size={48} />
        <p className="mono">{market.symbol} / USDG</p>
        <p>{t("desk.body")}</p>
        <article>
          <span className="stat-label">{t("desk.token")}</span>
          <strong>
            {row?.deployment ? (
              <a href={explorerToken(row.deployment.contractAddress)} target="_blank" rel="noreferrer">
                {row.deployment.contractAddress}
              </a>
            ) : (
              t("desk.noDeployment")
            )}
          </strong>
        </article>
        <article>
          <span className="stat-label">{t("desk.refPrice")}</span>
          <strong className="mono">
            {bid != null && ask != null && Number.isFinite(bid) && Number.isFinite(ask) ? `${formatPrice(bid)} / ${formatPrice(ask)}` : "—"}
          </strong>
          {generated ? <span className="stat-note">{t("desk.generatedAt", { time: new Date(generated).toLocaleString() })}</span> : null}
          {row?.asset?.currentMultiplier ? <span className="stat-note">{t("desk.multiplier", { value: row.asset.currentMultiplier })}</span> : null}
          {halted ? <span className="stat-note">{t("desk.halted")}</span> : null}
        </article>
        <article>
          <span className="stat-label">{t("desk.fees")}</span>
          <strong>—</strong>
        </article>
        <p>{t("desk.unavailable")}</p>
        <div className="hex-group">
          <span className="hex hex-md hex-green">{t("desk.deposit")}</span>
          <span className="hex-outline hex-notch hex-md hex-slate">{t("desk.withdraw")}</span>
          <Link className="hex hex-md hex-slate" href="/vaults">
            {t("desk.cta")}
          </Link>
        </div>
      </div>
    </div>
  );
}
