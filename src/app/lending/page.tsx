import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getT } from "@/i18n/server";
import "@/styles/strategies.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("lending");
  return { title: t("meta.title") };
}

export default async function LendingPage() {
  const t = await getT("lending");
  return (
    <main className="app-page">
      <SiteHeader />
      <section className="masthead">
        <div className="masthead-inner">
          <div className="masthead-head">
            <div className="masthead-title">
              <p className="eyebrow">{t("dir.eyebrow")}</p>
              <h1>
                {t("dir.title.before")}
                <em className="serif">{t("dir.title.em")}</em>
              </h1>
            </div>
            <p className="masthead-intro">{t("dir.intro")}</p>
            <div className="masthead-aside">
            <Link className="hex hex-md hex-green" href="/markets">
              {t("dir.cta")}
            </Link>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
