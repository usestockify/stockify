"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PrefetchLink } from "@/components/PrefetchLink";
import { StockLogo } from "@/components/StockLogo";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useT } from "@/i18n/client";
import type { DataEnvelope } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { STOCKIFY_MARKETS, marketHref } from "@/lib/markets";
import { formatUnits, type Address } from "viem";
import { publicClient } from "@/lib/chain";
import { stockifyVaultAbi } from "@/lib/stockify/abis";
import type { StockifyMarketRow } from "@/lib/stockify/catalog";

export function VaultTable({ variant = "vaults" }: { variant?: "markets" | "vaults" }) {
  const t = useT("vaults");
  const hero = variant === "markets" ? "markets.hero" : "hero";
  const { address: owner } = useWallet();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"name" | "symbol">("symbol");
  const [catalog, setCatalog] = useState<StockifyMarketRow[] | null>(null);
  const [catalogError, setCatalogError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/markets/catalog", { cache: "no-store" });
        const json = (await res.json()) as DataEnvelope<StockifyMarketRow[]>;
        if (cancelled) return;
        setCatalog(json.data);
        setCatalogError(json.error ?? "");
      } catch (error) {
        if (!cancelled) setCatalogError(error instanceof Error ? error.message : t("table.unavailable"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const rows = catalog ?? STOCKIFY_MARKETS.map((m) => ({ symbol: m.symbol, slug: m.slug, name: null }) as Pick<StockifyMarketRow, "symbol" | "slug" | "name">);
  const sorted = useMemo(() => {
    const list = [...rows];
    return list.sort((a, b) =>
      sort === "symbol"
        ? a.symbol.localeCompare(b.symbol, "en")
        : (a.name ?? a.symbol).localeCompare(b.name ?? b.symbol, "en"),
    );
  }, [rows, sort]);
  const q = query.trim().toLowerCase();
  const visible = sorted.filter((m) => !q || m.symbol.toLowerCase().includes(q) || (m.name ?? "").toLowerCase().includes(q));

  return (
    <div className="vault-table-page">
      <section className="masthead masthead-1120 masthead-bleed">
        <div className="masthead-inner">
          <div className="masthead-head">
            <div className="masthead-title">
              <p className="eyebrow">{t(`${hero}.eyebrow`)}</p>
              <h1>
                {t(`${hero}.title.before`)}
                <em className="serif">{t(`${hero}.title.em`)}</em>
              </h1>
            </div>
            <p className="masthead-intro">{t(`${hero}.intro`)}</p>
          </div>
          <div className="mast-stats">
            <article>
              <span className="stat-label">{t("stats.tvl")}</span>
              <strong className="stat-value">—</strong>
              <span className="stat-note">{t("stats.acrossMany", { n: STOCKIFY_MARKETS.length })}</span>
            </article>
            <article>
              <span className="stat-label">{t("stats.open")}</span>
              <strong className="stat-value">{STOCKIFY_MARKETS.length}</strong>
              <span className="stat-note">{t("stats.openNote")}</span>
            </article>
            <article>
              <span className="stat-label">{t("stats.fees")}</span>
              <strong className="stat-value">—</strong>
              <span className="stat-note">{t("stats.feesNote")}</span>
            </article>
            <article>
              <span className="stat-label">{t("stats.positions")}</span>
              <strong className="stat-value">—</strong>
              <span className="stat-note">{owner ? t("stats.positionsNote") : t("stats.connectNote")}</span>
            </article>
          </div>
        </div>
      </section>
      <div className="vault-table-toolbar">
        <label className="vault-table-search">
          <Search size={15} strokeWidth={1.5} aria-hidden="true" />
          <input type="search" placeholder={t("toolbar.searchPlaceholder")} value={query} onChange={(e) => setQuery(e.target.value)} aria-label={t("toolbar.searchAria")} />
        </label>
        <label className="vault-table-sort">
          <span>{t("toolbar.sort")}</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label={t("toolbar.sortAria")}>
            <option value="name">{t("toolbar.sortName")}</option>
            <option value="symbol">{t("table.vault")}</option>
          </select>
        </label>
        <span className="vault-table-note mono">{catalogError || t("toolbar.note")}</span>
      </div>
      <div className="vault-table-scroll">
        <table className="vault-table">
          <colgroup>
            <col className="col-vault" />
            <col className="col-status" />
            <col className="col-tvl" />
            <col className="col-apr" />
            <col className="col-range" />
            <col className="col-health" />
            <col className="col-position" />
            <col className="col-action" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">{t("table.vault")}</th>
              <th scope="col">{t("table.status")}</th>
              <th scope="col" className="vault-table-num">
                {t("table.tvl")}
              </th>
              <th scope="col" className="vault-table-apr-heading" title={t("table.aprTitle")}>
                {t("table.feeApr")}
              </th>
              <th scope="col">{t("table.refPrice")}</th>
              <th scope="col">{t("table.lpStatus")}</th>
              <th scope="col" className="vault-table-num">
                {t("table.yourPosition")}
              </th>
              <th scope="col">
                <span className="sr-only">{t("table.action")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((m) => (
              <CatalogRow key={m.symbol} row={m as StockifyMarketRow} />
            ))}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={8} className="vault-table-muted">
                  {t("empty.noMatch")}{" "}
                  <button type="button" className="vault-table-reset" onClick={() => setQuery("")}>
                    {t("empty.clear")}
                  </button>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p className="vault-table-updated" role="status">
        {t("updated.catalog", { n: STOCKIFY_MARKETS.length })}
      </p>
      <p className="vault-table-footnote">{t("footnote")}</p>
    </div>
  );
}

function CatalogRow({ row }: { row: StockifyMarketRow }) {
  const t = useT("vaults");
  const bid = row.price?.equity.bid != null ? Number(row.price.equity.bid) : null;
  const ask = row.price?.equity.ask != null ? Number(row.price.equity.ask) : null;
  const generated = row.price?.equity.generatedAt;
  return (
    <tr>
      <td>
        <PrefetchLink href={marketHref(row.slug)} className="vault-table-identity">
          <StockLogo symbol={row.symbol} logoUrl={row.logoUrl} name={row.name} size={32} />
          <span>
            <b>{row.name ?? row.symbol}</b>
            <small className="mono">
              {row.symbol} / USDG
              {row.displayMid != null ? ` · ${formatPrice(row.displayMid)}` : ""}
            </small>
          </span>
        </PrefetchLink>
      </td>
      <td>
        <span className={`vault-table-tag${row.vault?.status === "live" ? "" : " vault-table-tag-waiting"}`}>
          {row.vault?.status === "live" ? t("table.live") : t("table.notDeployed")}
        </span>
      </td>
      <td data-label={t("table.tvl")} className="mono vault-table-num">
        {row.vault?.tvl != null ? row.vault.tvl : t("table.notDeployed")}
      </td>
      <td data-label={t("table.feeApr")} className="mono vault-table-num vault-table-apr">
        {row.vault?.feesLifetime != null ? (
          <span className="mono">{row.vault.feesLifetime}</span>
        ) : (
          <span className="vault-table-muted" title={t("table.aprMissing")}>
            —
          </span>
        )}
      </td>
      <td data-label={t("table.refPrice")}>
        {bid != null && ask != null && Number.isFinite(bid) && Number.isFinite(ask) ? (
          <span className="mono" title={generated ?? undefined}>
            {formatPrice(bid)} / {formatPrice(ask)}
            {generated ? <small> · {new Date(generated).toLocaleString()}</small> : null}
          </span>
        ) : (
          <span className="vault-table-muted">{t("table.unavailable")}</span>
        )}
      </td>
      <td data-label={t("table.lpStatus")}>
        <span className={`vault-table-tag${row.vault?.range === "in-range" ? "" : " vault-table-tag-none"}`}>
          {t(`rangeStatus.${row.vault?.range ?? "waiting"}`)}
        </span>
      </td>
      <td data-label={t("table.yourPosition")} className="vault-table-position">
        <VaultPositionCell vault={row.vault?.address ?? null} />
      </td>
      <td className="vault-table-action">
        <PrefetchLink className="btn btn-sm btn-ghost" href={marketHref(row.slug)}>
          {t("table.view")}
        </PrefetchLink>
      </td>
    </tr>
  );
}

function VaultPositionCell({ vault }: { vault: string | null }) {
  const t = useT("vaults");
  const { address: owner } = useWallet();
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => {
    if (!owner || !vault) {
      setValue(null);
      return;
    }
    let cancelled = false;
    publicClient()
      .readContract({ address: vault as Address, abi: stockifyVaultAbi, functionName: "balanceOf", args: [owner] })
      .then(async (shares) => {
        if (cancelled) return;
        if (!shares) {
          setValue("0");
          return;
        }
        const assets = await publicClient().readContract({
          address: vault as Address,
          abi: stockifyVaultAbi,
          functionName: "convertToAssets",
          args: [shares],
        });
        if (!cancelled) setValue(Number(formatUnits(assets, 6)).toLocaleString(undefined, { maximumSignificantDigits: 6 }));
      })
      .catch(() => {
        if (!cancelled) setValue(null);
      });
    return () => {
      cancelled = true;
    };
  }, [owner, vault]);
  if (!owner) return <span className="vault-table-muted">{t("table.connectToSee")}</span>;
  if (!vault) return <span className="vault-table-muted">—</span>;
  return <span>{value ?? "—"}</span>;
}
