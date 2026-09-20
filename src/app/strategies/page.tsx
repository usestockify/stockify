import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { StockLogo } from "@/components/StockLogo";
import { getT } from "@/i18n/server";
import { BRAND } from "@/lib/brand";
import { STOCKIFY_MARKETS } from "@/lib/markets";
import "@/styles/strategies.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("strategies");
  return { title: t("meta.title") };
}

const PREVIEW = STOCKIFY_MARKETS.slice(0, 5).map((m) => m.symbol);
const BASKET = STOCKIFY_MARKETS.slice(0, 6).map((m) => m.symbol);

export default async function StrategiesPage() {
  const t = await getT("strategies");
  return (
    <main className="app-page">
      <SiteHeader />
      <section className="masthead">
        <div className="masthead-inner">
          <div className="masthead-head">
            <div className="masthead-title">
              <p className="eyebrow">{t("hero.eyebrow")}</p>
              <h1>
                {t("hero.title.before")}
                <em className="serif">{t("hero.title.em")}</em>
              </h1>
            </div>
            <p className="masthead-intro">{t("hero.intro")}</p>
            <div className="masthead-aside">
              <span className="strategy-status">
                {t("hero.live")}
              </span>
            </div>
          </div>
        </div>
      </section>
      <div className="strategies-page">
        <div className="strategy-grid">
          <article className="strategy-card">
            <header className="strategy-card-head">
              <div>
                <p className="eyebrow">{t("allocator.eyebrow")}</p>
                <h2>{t("allocator.title")}</h2>
              </div>
              <span className="strategy-status">{t("allocator.live")}</span>
            </header>
            <div className="strategy-visual strategy-allocator" aria-label={t("allocator.visualAria")}>
              <div className="strategy-allocator-bars" aria-hidden="true">
                {PREVIEW.map((s) => (
                  <span key={s} style={{ width: `${100 / PREVIEW.length}%` }}>
                    <StockLogo symbol={s} size={28} />
                    <b>{s}</b>
                  </span>
                ))}
              </div>
              <div className="strategy-basket-copy">
                <b>{t("allocator.visualTitle")}</b>
                <span>{t("allocator.visualSub")}</span>
              </div>
            </div>
            <p className="strategy-lede">{t("allocator.lede")}</p>
            <dl className="strategy-facts">
              <div>
                <dt>{t("facts.earns")}</dt>
                <dd>{t("allocator.earns")}</dd>
              </div>
              <div>
                <dt>{t("facts.exposure")}</dt>
                <dd>{t("allocator.exposure")}</dd>
              </div>
              <div>
                <dt>{t("facts.deposit")}</dt>
                <dd className="strategy-deposit">
                  <Image src="/brands/usdg.png" alt="" width={22} height={22} /> USDG
                </dd>
              </div>
            </dl>
            <footer className="strategy-card-foot">
              <span className="strategy-closed">{t("allocator.foot")}</span>
              <Link href="/allocator">
                {t("allocator.open")} <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </footer>
          </article>
          <article className="strategy-card">
            <header className="strategy-card-head">
              <div>
                <p className="eyebrow">{t("basket.eyebrow")}</p>
                <h2>{t("basket.title")}</h2>
              </div>
              <span className="strategy-status">{t("basket.live")}</span>
            </header>
            <div className="strategy-visual strategy-basket" aria-label={t("basket.visualAria")}>
              <div className="strategy-basket-marks">
                {BASKET.map((s, i) => (
                  <span key={s} style={{ zIndex: BASKET.length - i }}>
                    <StockLogo symbol={s} size={44} />
                  </span>
                ))}
              </div>
              <div className="strategy-basket-copy">
                <b>{t("basket.visualTitle")}</b>
                <span>{t("basket.visualSub")}</span>
              </div>
            </div>
            <p className="strategy-lede">{t("basket.lede")}</p>
            <dl className="strategy-facts">
              <div>
                <dt>{t("facts.earns")}</dt>
                <dd>{t("basket.earns")}</dd>
              </div>
              <div>
                <dt>{t("facts.exposure")}</dt>
                <dd>{t("basket.exposure")}</dd>
              </div>
              <div>
                <dt>{t("facts.deposit")}</dt>
                <dd className="strategy-deposit">
                  <Image src="/brands/usdg.png" alt="" width={22} height={22} /> USDG
                </dd>
              </div>
            </dl>
            <footer className="strategy-card-foot">
              <span className="strategy-closed">{t("basket.foot")}</span>
              <Link href="/docs">
                {t("basket.open")} <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </footer>
          </article>
        </div>
        <section className="strategy-notes" aria-label={t("notes.aria")}>
          <div>
            <h3>{t("notes.isTitle")}</h3>
            <p>{t("notes.isBody", { brand: BRAND.name })}</p>
          </div>
          <div>
            <h3>{t("notes.notTitle")}</h3>
            <p>{t("notes.notBody")}</p>
          </div>
          <div>
            <h3>{t("notes.beforeTitle")}</h3>
            <p>{t("notes.beforeBody")}</p>
          </div>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
