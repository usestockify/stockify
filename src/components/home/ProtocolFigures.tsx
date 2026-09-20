"use client";

import { STOCKIFY_MARKETS } from "@/lib/markets";
import { useT } from "@/i18n/client";

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
  return (
    <>
      <Cell label={t("pf.burned.label")} sub={t("pf.burned.sub")} value="—" note={t("pf.burned.unavailable")} />
      <Cell label={t("pf.tvl.label")} sub={t("pf.tvl.sub")} value="—" note={t("pf.tvl.note")} />
      <Cell label={t("pf.chain.label")} sub={t("pf.chain.sub")} value={count} note={t("pf.chain.note")} />
      <Cell label={t("pf.live.label")} sub={t("pf.live.sub")} value="—" note={t("pf.live.note")} />
      <Cell label={t("pf.split.label")} sub={t("pf.split.sub")} value="—" note={t("pf.split.note")} />
      <Cell label={t("pf.fees.label")} sub={t("pf.fees.sub")} value="—" note={t("pf.fees.note")} />
    </>
  );
}
