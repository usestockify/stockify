"use client";

import { ArrowRight, Landmark, Percent, Ruler } from "lucide-react";
import { PrefetchLink } from "@/components/PrefetchLink";
import { BrandMark } from "@/components/BrandMark";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { FEATURED_MARKETS, STOCKIFY_MARKETS, marketHref } from "@/lib/markets";
import { useT } from "@/i18n/client";

const TINTS = ["seafoam", "ice", "sky"] as const;

function VaultCard({
  symbol,
  name,
  slug,
  tint,
}: {
  symbol: string;
  name: string;
  slug: string;
  tint: (typeof TINTS)[number];
}) {
  const t = useT("home");
  return (
    <PrefetchLink href={marketHref(slug)} className={`home-vault-card home-vault-card-${tint}`}>
      <div className="home-vault-card-head">
        <h3>{name}</h3>
        <div className="home-vault-stats">
          <span>
            <i>
              <Landmark size={14} strokeWidth={1.5} aria-hidden="true" />
            </i>
            <span>
              <b>—</b>
              <small>{t("cards.tvl")}</small>
            </span>
          </span>
          <span>
            <i>
              <Percent size={14} strokeWidth={1.5} aria-hidden="true" />
            </i>
            <span>
              <b>—</b>
              <small>{t("cards.apr.warming")}</small>
            </span>
          </span>
          <span>
            <i>
              <Ruler size={14} strokeWidth={1.5} aria-hidden="true" />
            </i>
            <span>
              <b>—</b>
              <small>{t("cards.lp")}</small>
            </span>
          </span>
        </div>
      </div>
      <div className="home-vault-diff">
        <div className="home-vault-file">
          <span className="mono">{symbol} / USDG</span>
        </div>
        <div className="home-vault-lines">
          <div className="home-vault-line del">
            <span className="mono">01</span>
            <span className="mono">−</span>
            <i style={{ width: "40%" }} />
            <em className="mono">{t("cards.lower")}</em>
          </div>
          <div className="home-vault-line add">
            <span className="mono">01</span>
            <span className="mono">+</span>
            <i style={{ width: "60%" }} />
            <em className="mono">{t("cards.current")}</em>
          </div>
          <div className="home-vault-line add">
            <span className="mono">02</span>
            <span className="mono">+</span>
            <i style={{ width: "80%" }} />
            <em className="mono">{t("cards.upper")}</em>
          </div>
        </div>
        <div className="home-vault-comment">
          <span className="home-vault-author">
            <BrandMark size={16} />
            <span>{BRAND.name.toLowerCase()}</span>
          </span>
          <p>{t("cards.comment.waiting")}</p>
        </div>
        <div className="home-vault-foot mono">
          {t("cards.open")} <ArrowRight size={12} strokeWidth={1.5} aria-hidden="true" />
        </div>
      </div>
    </PrefetchLink>
  );
}

export function LiveVaultCards() {
  const t = useT("home");
  return (
    <div className="home-vault-cards-wrap">
      <div className="home-vault-cards">
        {FEATURED_MARKETS.map((market, i) => (
          <VaultCard key={market.symbol} symbol={market.symbol} name={market.symbol} slug={market.slug} tint={TINTS[i]} />
        ))}
      </div>
      <p className="home-vault-updated">
        {t("cards.listed")}{" "}
        <Link href="/markets">{t("cards.seeAll", { count: STOCKIFY_MARKETS.length })}</Link>
      </p>
    </div>
  );
}
