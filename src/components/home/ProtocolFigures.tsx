"use client";

import { useEffect, useState } from "react";
import { STOCKIFY_MARKETS } from "@/lib/markets";
import { useT } from "@/i18n/client";
import type { DataEnvelope } from "@/lib/data";
import type { StockifyMarketRow } from "@/lib/stockify/catalog";

function Cell({ label, sub, value, note }: { label: string; sub: string; value: string; note: string }) {
  return (
    <article className="home-figure">
      <header>
        <span className="home-figure-label">{label}</span>
        <small className="mono">{sub}</small>
      </header>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  );
}

export function ProtocolFigures() {
  const t = useT("home");
  const count = String(STOCKIFY_MARKETS.length);
  const [tvl, setTvl] = useState<string>("—");
  const [live, setLive] = useState<string>("—");
  const [fees, setFees] = useState<string>("—");
  useEffect(() => {
    fetch("/api/markets/catalog")
      .then((r) => r.json() as Promise<DataEnvelope<StockifyMarketRow[]>>)
      .then((env) => {
        const rows = env.data ?? [];
        const liveRows = rows.filter((r) => r.vault.status === "live");
        const sum = liveRows.reduce((acc, r) => acc + Number(r.vault.tvl ?? 0), 0);
        const feeSum = liveRows.reduce((acc, r) => acc + Number(r.vault.feesLifetime ?? 0), 0);
        setLive(String(liveRows.length));
        setTvl(liveRows.length ? sum.toLocaleString(undefined, { maximumSignificantDigits: 8 }) : "—");
        setFees(liveRows.length ? feeSum.toLocaleString(undefined, { maximumSignificantDigits: 8 }) : "—");
      })
      .catch(() => undefined);
  }, []);
  return (
    <>
      <Cell label={t("pf.burned.label")} sub={t("pf.burned.sub")} value="—" note={t("pf.burned.unavailable")} />
      <Cell label={t("pf.tvl.label")} sub={t("pf.tvl.sub")} value={tvl} note={t("pf.tvl.note")} />
      <Cell label={t("pf.chain.label")} sub={t("pf.chain.sub")} value={count} note={t("pf.chain.note")} />
      <Cell label={t("pf.live.label")} sub={t("pf.live.sub")} value={live} note={t("pf.live.note")} />
      <Cell label={t("pf.split.label")} sub={t("pf.split.sub")} value="—" note={t("pf.split.note")} />
      <Cell label={t("pf.fees.label")} sub={t("pf.fees.sub")} value={fees} note={t("pf.fees.note")} />
    </>
  );
}
