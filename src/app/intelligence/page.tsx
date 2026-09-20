import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { IntelligenceOrbit } from "@/components/intelligence/IntelligenceOrbit";
import { getT } from "@/i18n/server";
import { BRAND } from "@/lib/brand";
import styles from "@/styles/intelligence.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("intelligence");
  return { title: t("meta.title"), description: t("meta.description") };
}
export const dynamic = "force-dynamic";

export default async function IntelligencePage() {
  const t = await getT("intelligence");
  return (
    <main className={styles.page}>
      <SiteHeader />
      <section className={styles.chamber} aria-labelledby="intelligence-title">
        <div className={styles.topline}>
          <span className={styles.status}>
            <span /> {t("teaser.status")}
          </span>
          <span className={styles.edition}>{t("teaser.edition", { brand: BRAND.nameUpper })}</span>
        </div>
        <div className={styles.hero}>
          <div className={styles.copy}>
            <p className={styles.eyebrow}>
              {t("teaser.eyebrow.before")} <span>×</span> {t("teaser.eyebrow.after")}
            </p>
            <h1 id="intelligence-title">
              {t("teaser.title.before")}
              <br />
              <em>{t("teaser.title.em")}</em>
            </h1>
            <p className={styles.intro}>
              {t("teaser.intro.1")}
              <br />
              {t("teaser.intro.2")}
            </p>
            <p className={styles.secret}>{t("teaser.secret")}</p>
            <Link className={styles.follow} href="/markets">
              {t("teaser.follow")} <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className={styles.signal} aria-hidden="true">
            <div className={styles.signalHalo} />
            <IntelligenceOrbit />
            <div className={styles.axisHorizontal} />
            <div className={styles.axisVertical} />
            <span className={styles.signalLabel}>{t("teaser.signalLabel")}</span>
            <span className={styles.signalIndex}>{BRAND.name.slice(0, 2).toUpperCase()} · 01</span>
          </div>
        </div>
        <div className={styles.reveal}>
          <div className={styles.revealCopy}>
            <p className={styles.eyebrow}>{t("teaser.status")}</p>
            <p className={styles.estimate}>{t("teaser.estimate")}</p>
          </div>
        </div>
        <div className={styles.bottomline}>
          <span>{t("teaser.bottom.1")}</span>
          <span>{t("teaser.bottom.2")}</span>
        </div>
      </section>
      <footer className={styles.footer}>
        <Link href="/">
          <ArrowLeft size={14} aria-hidden="true" /> {t("teaser.back", { brand: BRAND.name })}
        </Link>
        <span>{t("teaser.tagline")}</span>
        <span>© {new Date().getFullYear()} {BRAND.name}</span>
      </footer>
    </main>
  );
}
