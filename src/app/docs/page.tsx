import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, RadioTower, RefreshCw, ShieldCheck, WalletCards } from "lucide-react";
import { DocsFigure } from "@/components/docs/DocsFigure";
import {
  ContractsArt,
  DepositArt,
  FeesArt,
  MarketsArt,
  OracleArt,
  OverviewArt,
  PortfolioArt,
  RangeArt,
  RisksArt,
  SharesArt,
  StocksArt,
  TradeArt,
  UsdgHubArt,
  VaultsArt,
  WithdrawArt,
} from "@/components/docs/figures";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getT } from "@/i18n/server";
import { explorerAddress, explorerToken } from "@/lib/chain";
import { STOCKIFY_MARKETS } from "@/lib/markets";
import { PONS_CONTRACTS, PROTOCOL_CONTRACTS } from "@/lib/protocol-contracts";
import { getStockifyCatalog } from "@/lib/stockify/catalog";
import styles from "@/styles/docs.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("docs");
  return { title: t("meta.title") };
}

const MARKETS = [...STOCKIFY_MARKETS].sort((a, b) => a.symbol.localeCompare(b.symbol));

export default async function DocsPage() {
  const t = await getT("docs");
  const catalog = await getStockifyCatalog();
  const markets = MARKETS.map((m) => {
    const row = catalog.data?.find((item) => item.symbol === m.symbol);
    return { symbol: m.symbol, name: row?.name ?? m.symbol, deployment: row?.deployment ?? null };
  });
  return (
    <main className="app-page">
      <SiteHeader />
      <div className={styles.page}>
        <aside className={styles.aside} aria-label={t("aside.label")}>
          <p>{t("aside.onThisPage")}</p>
          <nav>
            <Link href="/help">{t("aside.help")}</Link>
            <Link href="/verify">{t("aside.verify")}</Link>
            <a href="#overview">{t("aside.overview")}</a>
            <a href="#markets">{t("aside.markets")}</a>
            <a href="#vaults">{t("aside.vaults")}</a>
            <a href="#usdg">{t("aside.usdg")}</a>
            <a href="#stocks">{t("aside.stocks")}</a>
            <a href="#deposits">{t("aside.deposits")}</a>
            <a href="#shares">{t("aside.shares")}</a>
            <a href="#withdrawals">{t("aside.withdrawals")}</a>
            <a href="#ranges">{t("aside.ranges")}</a>
            <a href="#fees">{t("aside.fees")}</a>
            <a href="#oracles">{t("aside.oracles")}</a>
            <a href="#portfolio">{t("aside.portfolio")}</a>
            <a href="#trade">{t("aside.trade")}</a>
            <a href="#contracts">{t("aside.contracts")}</a>
            <a href="#risks">{t("aside.risks")}</a>
            <a href="#supported">{t("aside.supported")}</a>
            <a href="#chain">{t("aside.chain")}</a>
            <a href="#faq">{t("aside.faq")}</a>
          </nav>
        </aside>
        <article className={styles.content}>
          <header className={styles.hero} id="overview">
            <div className={styles.heroMeta}>
              <span>{t("hero.kicker")}</span>
              <span>Robinhood Chain · 4663</span>
            </div>
            <h1>
              {t("hero.title.line1")}
              <br />
              {t("hero.title.line2")}
              <em>{t("hero.title.em")}</em>
            </h1>
            <p>{t("hero.lead")}</p>
            <div className={styles.heroActions}>
              <Link className="btn btn-primary" href="/markets">
                {t("hero.explore")} <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <a className="btn btn-ghost" href="#contracts">
                {t("hero.contracts")}
              </a>
            </div>
            <DocsFigure n="01" caption={t("fig.overview")}>
              <OverviewArt />
            </DocsFigure>
          </header>

          <ThreeStep id="markets" prefix="markets" t={t} figure={<DocsFigure n="02" caption={t("fig.markets")}><MarketsArt /></DocsFigure>} />
          <FourStep id="vaults" prefix="vaults" t={t} figure={<DocsFigure n="03" caption={t("fig.vaults")}><VaultsArt /></DocsFigure>} />
          <ThreeStep id="usdg" prefix="usdg" t={t} figure={<DocsFigure n="04" caption={t("fig.usdg")}><UsdgHubArt /></DocsFigure>} />
          <ThreeStep id="stocks" prefix="stocks" t={t} figure={<DocsFigure n="05" caption={t("fig.stocks")}><StocksArt /></DocsFigure>} />
          <ThreeStep id="deposits" prefix="deposits" t={t} figure={<DocsFigure n="06" caption={t("fig.deposits")}><DepositArt /></DocsFigure>} />
          <ThreeStep id="shares" prefix="shares" t={t} figure={<DocsFigure n="07" caption={t("fig.shares")}><SharesArt /></DocsFigure>} />
          <ThreeStep id="withdrawals" prefix="withdrawals" t={t} figure={<DocsFigure n="08" caption={t("fig.withdrawals")}><WithdrawArt /></DocsFigure>} />
          <ThreeStep id="ranges" prefix="ranges" t={t} figure={<DocsFigure n="09" caption={t("fig.ranges")}><RangeArt /></DocsFigure>} />

          <section className={styles.section} id="fees">
            <div className={styles.sectionLabel}>{t("fees.label")}</div>
            <div className={styles.sectionIntro}>
              <h2>{t("fees.title")}</h2>
              <p>{t("fees.lead")}</p>
            </div>
            <DocsFigure n="10" caption={t("fig.fees")}>
              <FeesArt />
            </DocsFigure>
            <div className={styles.feeSplit}>
              {([1, 2, 3] as const).map((n) => (
                <article key={n}>
                  <h3>{t(`fees.${n}.title`)}</h3>
                  <p>{t(`fees.${n}.body`)}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.section} id="oracles">
            <div className={styles.sectionLabel}>{t("oracles.label")}</div>
            <div className={styles.sectionIntro}>
              <h2>{t("oracles.title")}</h2>
              <p>{t("oracles.lead")}</p>
            </div>
            <DocsFigure n="11" caption={t("fig.oracles")}>
              <OracleArt />
            </DocsFigure>
            <div className={styles.oraclePanel}>
              <div className={styles.oracleBadge}>
                <RadioTower size={32} aria-hidden="true" />
                <strong>24/5</strong>
                <span>{t("oracles.badge")}</span>
              </div>
              <div className={styles.oracleRules}>
                <article>
                  <ShieldCheck size={20} aria-hidden="true" />
                  <div>
                    <h3>{t("oracles.deposits.title")}</h3>
                    <p>{t("oracles.deposits.body")}</p>
                  </div>
                </article>
                <article>
                  <Clock3 size={20} aria-hidden="true" />
                  <div>
                    <h3>{t("oracles.weekends.title")}</h3>
                    <p>{t("oracles.weekends.body")}</p>
                  </div>
                </article>
                <article>
                  <WalletCards size={20} aria-hidden="true" />
                  <div>
                    <h3>{t("oracles.exits.title")}</h3>
                    <p>{t("oracles.exits.body")}</p>
                  </div>
                </article>
                <article>
                  <RefreshCw size={20} aria-hidden="true" />
                  <div>
                    <h3>{t("oracles.rebalances.title")}</h3>
                    <p>{t("oracles.rebalances.body")}</p>
                  </div>
                </article>
              </div>
            </div>
          </section>

          <ThreeStep id="portfolio" prefix="portfolio" t={t} figure={<DocsFigure n="12" caption={t("fig.portfolio")}><PortfolioArt /></DocsFigure>} />
          <ThreeStep id="trade" prefix="trade" t={t} figure={<DocsFigure n="13" caption={t("fig.trade")}><TradeArt /></DocsFigure>} />

          <section className={styles.section} id="contracts">
            <div className={styles.sectionLabel}>{t("contracts.label")}</div>
            <div className={styles.sectionIntro}>
              <h2>{t("contracts.title")}</h2>
              <p>{t("contracts.lead")}</p>
            </div>
            <DocsFigure n="14" caption={t("fig.contracts")}>
              <ContractsArt />
            </DocsFigure>
            <div className={styles.contractHeader}>
              <span>{t("contracts.col.vault")}</span>
              <span>{t("contracts.col.address")}</span>
              <span>{t("contracts.col.source")}</span>
            </div>
            <div className={styles.contractList}>
              {PROTOCOL_CONTRACTS.map((c) => (
                <div className={styles.contractRow} key={c.id}>
                  <strong>{c.label}</strong>
                  {c.address ? (
                    <a className={styles.address} href={explorerAddress(c.address)} target="_blank" rel="noreferrer">
                      {c.address}
                    </a>
                  ) : (
                    <span className={styles.address}>—</span>
                  )}
                  <span className={styles.verified}>{c.status === "configured" ? t("contracts.verified") : t("contracts.unpublished")}</span>
                </div>
              ))}
            </div>
            <div className={styles.sectionIntro} style={{ marginTop: 28 }}>
              <p>{t("contracts.ponsLead")}</p>
            </div>
            <div className={styles.contractHeader}>
              <span>{t("contracts.col.vault")}</span>
              <span>{t("contracts.col.address")}</span>
              <span>{t("contracts.col.source")}</span>
            </div>
            <div className={styles.contractList}>
              {PONS_CONTRACTS.map((c) => (
                <div className={styles.contractRow} key={c.id}>
                  <strong>{c.label}</strong>
                  {c.address ? (
                    <a className={styles.address} href={explorerAddress(c.address)} target="_blank" rel="noreferrer">
                      {c.address}
                    </a>
                  ) : (
                    <span className={styles.address}>—</span>
                  )}
                  <span className={styles.verified}>{t("contracts.verified")}</span>
                </div>
              ))}
            </div>
            <div className={styles.sectionIntro} style={{ marginTop: 28 }}>
              <p>{t("contracts.stockLead")}</p>
            </div>
            <div className={styles.contractHeader}>
              <span>{t("contracts.col.vault")}</span>
              <span>{t("contracts.col.address")}</span>
              <span>{t("contracts.col.source")}</span>
            </div>
            <div className={styles.contractList}>
              {markets.map((c) => (
                <div className={styles.contractRow} key={c.symbol}>
                  <strong>{c.symbol}</strong>
                  {c.deployment ? (
                    <a className={styles.address} href={explorerToken(c.deployment.contractAddress)} target="_blank" rel="noreferrer">
                      {c.deployment.contractAddress}
                    </a>
                  ) : (
                    <span className={styles.address}>—</span>
                  )}
                  <span className={styles.verified}>{c.deployment ? t("contracts.verified") : t("contracts.notDeployed")}</span>
                </div>
              ))}
            </div>
            <div className={styles.sectionIntro} style={{ marginTop: 28 }}>
              <p>{t("contracts.marketsLead", { count: MARKETS.length })}</p>
            </div>
            <div className={styles.contractHeader}>
              <span>{t("contracts.col.vault")}</span>
              <span>{t("contracts.col.address")}</span>
              <span>{t("contracts.col.source")}</span>
            </div>
            <div className={styles.contractList}>
              {MARKETS.map((c) => (
                <div className={styles.contractRow} key={c.symbol}>
                  <strong>{c.symbol}</strong>
                  <span className={styles.address}>—</span>
                  <span className={styles.verified}>{t("contracts.notDeployed")}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.section} id="risks">
            <div className={styles.sectionLabel}>{t("risks.label")}</div>
            <div className={styles.sectionIntro}>
              <h2>{t("risks.title")}</h2>
              <p>{t("risks.lead")}</p>
            </div>
            <DocsFigure n="15" caption={t("fig.risks")}>
              <RisksArt />
            </DocsFigure>
            <div className={styles.safeguardGrid}>
              {([1, 2, 3, 4] as const).map((n) => (
                <article key={n}>
                  <ShieldCheck size={22} aria-hidden="true" />
                  <h3>{t(`risks.${n}.title`)}</h3>
                  <p>{t(`risks.${n}.body`)}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.section} id="supported">
            <div className={styles.sectionLabel}>{t("supported.label")}</div>
            <div className={styles.sectionIntro}>
              <h2>{t("supported.title")}</h2>
              <p>{t("supported.lead")}</p>
            </div>
            <div className={styles.contractList}>
              {markets.map((c) => (
                <div className={styles.contractRow} key={c.symbol}>
                  <strong>{c.symbol}</strong>
                  <span className={styles.address}>{c.name ?? c.symbol}</span>
                  <span className={styles.verified}>USDG</span>
                </div>
              ))}
            </div>
          </section>

          <ThreeStep id="chain" prefix="chain" t={t} />

          <section className={styles.section} id="faq">
            <div className={styles.sectionLabel}>{t("faq.label")}</div>
            <div className={styles.faq}>
              {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const).map((n) => (
                <details key={n}>
                  <summary>{t(`faq.${n}.q`)}</summary>
                  <p>{t(`faq.${n}.a`)}</p>
                </details>
              ))}
            </div>
          </section>
        </article>
      </div>
      <SiteFooter />
    </main>
  );
}

function ThreeStep({
  id,
  prefix,
  t,
  figure,
}: {
  id: string;
  prefix: string;
  t: Awaited<ReturnType<typeof getT>>;
  figure?: ReactNode;
}) {
  return (
    <section className={styles.section} id={id}>
      <div className={styles.sectionLabel}>{t(`${prefix}.label`)}</div>
      <div className={styles.sectionIntro}>
        <h2>{t(`${prefix}.title`)}</h2>
        <p>{t(`${prefix}.lead`)}</p>
      </div>
      {figure}
      <div className={styles.steps}>
        {([1, 2, 3] as const).map((n) => (
          <article key={n}>
            <span>{n}</span>
            <h3>{t(`${prefix}.${n}.title`)}</h3>
            <p>{t(`${prefix}.${n}.body`)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FourStep({
  id,
  prefix,
  t,
  figure,
}: {
  id: string;
  prefix: string;
  t: Awaited<ReturnType<typeof getT>>;
  figure?: ReactNode;
}) {
  return (
    <section className={styles.section} id={id}>
      <div className={styles.sectionLabel}>{t(`${prefix}.label`)}</div>
      <div className={styles.sectionIntro}>
        <h2>{t(`${prefix}.title`)}</h2>
        <p>{t(`${prefix}.lead`)}</p>
      </div>
      {figure}
      <div className={styles.steps}>
        {([1, 2, 3, 4] as const).map((n) => (
          <article key={n}>
            <span>{n}</span>
            <h3>{t(`${prefix}.step${n}.title`)}</h3>
            <p>{t(`${prefix}.step${n}.body`)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
