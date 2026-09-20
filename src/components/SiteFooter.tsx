import Link from "next/link";
import { BRAND, CHAIN_NAME } from "@/lib/brand";
import { BrandMark } from "./BrandMark";
import { BrandWireframe } from "./BrandWireframe";
import { FooterCubes } from "./FooterCubes";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { getT } from "@/i18n/server";

type Column = { key: string; links: { href: string; key: string; external?: boolean; soon?: boolean }[] };

/** Column and link labels resolve through `t("col.<key>")` and `t("link.<key>")` at render time. */
const COLUMNS: Column[] = [
  {
    key: "products",
    links: [
      { href: "/markets", key: "markets" },
      { href: "/vaults", key: "vaults" },
      { href: "/trade", key: "trade" },
      { href: "/portfolio", key: "portfolio" },
    ],
  },
  {
    key: "soon",
    links: [
      { href: "/strategies", key: "strategies" },
      { href: "/allocator", key: "allocator" },
    ],
  },
  {
    key: "resources",
    links: [
      { href: "/docs", key: "docs" },
      { href: "/docs#contracts", key: "contracts" },
      { href: "/status", key: "status" },
      { href: "/docs#risks", key: "risk" },
    ],
  },
  {
    key: "network",
    links: [
      { href: "https://robinhoodchain.blockscout.com", key: "chain", external: true },
    ],
  },
];

function FooterLink({ href, label, external, soonLabel }: { href: string; label: string; external?: boolean; soonLabel?: string }) {
  const text = soonLabel ? `${label} · ${soonLabel}` : label;
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {text} ↗
    </a>
  ) : (
    <Link href={href}>{text}</Link>
  );
}

export async function SiteFooter() {
  const t = await getT("footer");
  const year = new Date().getFullYear();
  return (
    <footer className="gf bg-paper-dot" id="site-footer">
      <div className="div-double-dashed gf-top" aria-hidden="true" />
      <div className="gf-cols">
        <div className="div-double-solid-v" aria-hidden="true" />
        <div className="gf-logo-col">
          <BrandWireframe />
        </div>
        <div className="div-double-solid-v" aria-hidden="true" />
        {COLUMNS.map((col, i) => (
          <div key={col.key} className="gf-col-wrap" style={{ display: "contents" }}>
            <nav className="gf-col" aria-label={t(`col.${col.key}`)}>
              <h2>{t(`col.${col.key}`)}</h2>
              {col.links.map((l) => (
                <FooterLink key={l.href + l.key} href={l.href} label={t(`link.${l.key}`)} external={l.external} />
              ))}
              {i === COLUMNS.length - 1 ? (
                <>
                  <h2 style={{ marginTop: 12 }}>{t("col.socials")}</h2>
                  <div className="gf-socials">
                    <a href={BRAND.xUrl} target="_blank" rel="noopener noreferrer" aria-label={t("aria.onX", { name: BRAND.name })}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/brands/x.svg" alt="" width={14} height={14} />
                    </a>
                    <a href={BRAND.telegramUrl} target="_blank" rel="noopener noreferrer" aria-label={t("aria.onTelegram", { name: BRAND.name })}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/brands/telegram.svg" alt="" width={14} height={14} />
                    </a>
                    <a href="https://robinhoodchain.blockscout.com" target="_blank" rel="noopener noreferrer" aria-label={t("aria.explorer", { chain: CHAIN_NAME })}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/brands/robinhood-mark.svg" alt="" width={14} height={14} />
                    </a>
                  </div>
                </>
              ) : null}
            </nav>
            <div className="div-double-solid-v" aria-hidden="true" />
          </div>
        ))}
      </div>

      <div className="gf-mobile">
        <div className="gf-mobile-band">
          {/* eslint-disable-next-line @next/next/no-img-element -- next/image hidden attr hydrates poorly on this decorative asset */}
          <img src="/design/scales-footer.png" alt="" width={1080} height={1080} />
          <Link className="gf-mobile-brand" href="/" aria-label={t("aria.home", { name: BRAND.name })}>
            <BrandMark color="#3D3B4F" />
            <span className="gh-wordmark">{BRAND.name}</span>
          </Link>
        </div>
        <div className="div-double-dashed gf-top" aria-hidden="true" />
        <div className="gf-mobile-grid">
          {COLUMNS.map((col, i) => (
            <div key={col.key}>
              <span className="gf-h">{t(`col.${col.key}`)}</span>
              {col.links.map((l) => (
                <FooterLink key={l.href + l.key} href={l.href} label={t(`link.${l.key}`)} external={l.external} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="div-double-dashed gf-top" aria-hidden="true" />
      <div className="gf-cubes-wrap">
        <FooterCubes />
      </div>
      <div className="gf-bottom g-shell">
        <span className="gf-copy">{t("copyright", { year, name: BRAND.name, chain: CHAIN_NAME })}</span>
        <LanguageSwitcher variant="list" />
      </div>
    </footer>
  );
}
