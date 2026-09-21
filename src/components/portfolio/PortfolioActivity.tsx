"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { StockAssetLogo } from "@/components/StockAssetLogo";
import { useT } from "@/i18n/client";
import { explorerTx } from "@/lib/chain";
import type { WalletActivityRow } from "@/lib/wallet/activity";

export function PortfolioActivity({ owner }: { owner: `0x${string}` }) {
  const t = useT("portfolio");
  const [rows, setRows] = useState<WalletActivityRow[] | null>(null);
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState("");
  const [scope, setScope] = useState("BLOCKSCOUT");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/wallet/activity?owner=${owner}`, { cache: "no-store" });
        const json = (await res.json()) as { data?: WalletActivityRow[] | null; error?: string; status?: string; scope?: string; source?: string };
        if (!alive) return;
        setScope(json.scope ?? (json.source === "STOCKIFY_INDEXER" ? "Vaultly/PONS activity" : "BLOCKSCOUT"));
        if (!json.data) {
          setHidden(true);
          setRows([]);
          setError(json.error ?? "");
          return;
        }
        setHidden(false);
        setRows(json.data);
      } catch {
        if (alive) {
          setHidden(true);
          setError(t("activity.readError"));
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [owner, t]);

  if (hidden) return null;

  return (
    <section className="wallet-vault-position portfolio-activity" aria-labelledby="activity-heading">
      <div className="wallet-section-heading">
        <div>
          <p className="eyebrow">{t("activity.eyebrow")}</p>
          <h2 id="activity-heading">{t("activity.title")}</h2>
        </div>
        <span className="portfolio-activity-count source-label">{scope}</span>
      </div>
      {error ? (
        <p role="status" className="fine-print">
          {error}
        </p>
      ) : !rows ? (
        <p role="status">{t("activity.reading")}</p>
      ) : rows.length === 0 ? (
        <p role="status">{t("activity.emptyIndexed")}</p>
      ) : (
        <ol className="portfolio-activity-list">
          {rows.map((row) => (
            <li key={`${row.hash}:${row.token}`}>
              <StockAssetLogo symbol={row.token ?? "TX"} size={24} />
              <span>
                <b>{row.kind}</b>
                <small>
                  {row.token ?? ""} {row.block ? `· block ${row.block}` : ""}
                </small>
              </span>
              <a href={explorerTx(row.hash)} target="_blank" rel="noreferrer">
                {row.hash.slice(0, 10)}… <ArrowUpRight size={13} />
              </a>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
