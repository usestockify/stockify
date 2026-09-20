"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatUnits, maxUint256, parseUnits, type Address, type Hex } from "viem";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useT } from "@/i18n/client";
import type { TFunction } from "@/i18n";
import { erc20Abi } from "@/lib/abis";
import { explorerTx, publicClient, robinhoodChain } from "@/lib/chain";
import { stockifyRouterAbi, stockifyVaultAbi } from "@/lib/stockify/abis";
import { txErrorMessage } from "./txError";

const fmt = (raw: bigint, decimals: number) => Number(formatUnits(raw, decimals)).toLocaleString(undefined, { maximumSignificantDigits: 7 });

function parseAmount(value: string, decimals: number, t: TFunction) {
  if (!/^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(value) || (value.split(".")[1]?.length ?? 0) > decimals) throw new Error(t("error.invalidAmount"));
  const raw = parseUnits(value, decimals);
  if (raw <= 0n) throw new Error(t("error.aboveZero"));
  return raw;
}

export function StockifyVaultActions({
  vault,
  router,
  usdg,
}: {
  vault: Address;
  router: Address;
  usdg: Address;
}) {
  const t = useT("vaults");
  const { address: owner, ready, connect, walletClient, onTargetChain, switchChain, network } = useWallet();
  const [shares, setShares] = useState<bigint | null>(null);
  const [shareDecimals, setShareDecimals] = useState(9);
  const [usdgBalance, setUsdgBalance] = useState<bigint | null>(null);
  const [assets, setAssets] = useState<bigint | null>(null);
  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [percent, setPercent] = useState("100");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(() => t("tx.processing"));
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [hash, setHash] = useState<Hex | null>(null);
  const [quoteShares, setQuoteShares] = useState<bigint | null>(null);
  const busyRef = useRef(false);

  const refresh = useCallback(async () => {
    const client = publicClient();
    try {
      const [dec, total, bal] = await Promise.all([
        client.readContract({ address: vault, abi: stockifyVaultAbi, functionName: "decimals" }),
        client.readContract({ address: vault, abi: stockifyVaultAbi, functionName: "totalAssets" }),
        owner
          ? client.readContract({ address: vault, abi: stockifyVaultAbi, functionName: "balanceOf", args: [owner] })
          : Promise.resolve(0n),
      ]);
      setShareDecimals(dec);
      setShares(owner ? bal : null);
      if (owner && bal > 0n) {
        const userAssets = await client.readContract({ address: vault, abi: stockifyVaultAbi, functionName: "convertToAssets", args: [bal] });
        setAssets(userAssets);
      } else {
        setAssets(total);
      }
    } catch {
      /* keep last */
    }
    if (owner) {
      try {
        setUsdgBalance(await publicClient().readContract({ address: usdg, abi: erc20Abi, functionName: "balanceOf", args: [owner] }));
      } catch {}
    } else setUsdgBalance(null);
  }, [vault, usdg, owner]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 15_000);
    return () => clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (!amount || mode !== "deposit") {
      setQuoteShares(null);
      return;
    }
    let raw: bigint;
    try {
      raw = parseAmount(amount, 6, t);
    } catch {
      setQuoteShares(null);
      return;
    }
    let cancelled = false;
    publicClient()
      .readContract({ address: vault, abi: stockifyVaultAbi, functionName: "previewDeposit", args: [raw] })
      .then((q) => {
        if (!cancelled) setQuoteShares(q);
      })
      .catch(() => {
        if (!cancelled) setQuoteShares(null);
      });
    return () => {
      cancelled = true;
    };
  }, [amount, mode, vault, t]);

  async function send(to: Address, data: { abi: typeof stockifyRouterAbi | typeof stockifyVaultAbi | typeof erc20Abi; functionName: string; args: unknown[] }, label: string) {
    if (!walletClient || !owner) throw new Error(t("error.connect"));
    if (!onTargetChain) {
      setStatus(t("error.connect"));
      await switchChain();
    }
    setProgress(t("tx.confirmInWallet", { label }));
    const hash = await walletClient.writeContract({
      address: to,
      abi: data.abi,
      functionName: data.functionName as never,
      args: data.args as never,
      account: owner,
      chain: robinhoodChain,
    } as never);
    setHash(hash);
    setStatus(t("tx.waiting"));
    setProgress(t("tx.waiting"));
    const receipt = await publicClient().waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") throw new Error(t("error.reverted"));
    return receipt;
  }

  async function run(kind: "deposit" | "withdraw") {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setStatus(t("tx.checkingWallet"));
    try {
      if (!owner || !walletClient) {
        await connect();
        return;
      }
      if (network === "wrong-network") {
        await switchChain();
      }
      if (kind === "deposit") {
        const raw = parseAmount(amount, 6, t);
        setStatus(t("tx.checkingDeposit"));
        const allowance = await publicClient().readContract({
          address: usdg,
          abi: erc20Abi,
          functionName: "allowance",
          args: [owner, router],
        });
        if (allowance < raw) {
          setProgress(t("tx.approveInWallet"));
          await send(usdg, { abi: erc20Abi, functionName: "approve", args: [router, maxUint256] }, t("tx.label.approval"));
        }
        const preview = await publicClient().readContract({ address: vault, abi: stockifyVaultAbi, functionName: "previewDeposit", args: [raw] });
        const minShares = (preview * 99n) / 100n;
        setProgress(t("tx.confirmDeposit"));
        await send(router, { abi: stockifyRouterAbi, functionName: "deposit", args: [vault, raw, owner, minShares] }, t("tx.label.deposit"));
      } else {
        if (!shares || shares === 0n) throw new Error(t("error.noShares"));
        const pct = Number(percent);
        if (!Number.isFinite(pct) || pct <= 0 || pct > 100) throw new Error(t("error.percentRange"));
        const burn = (shares * BigInt(Math.round(pct * 100))) / 10000n;
        if (burn === 0n) throw new Error(t("error.noShares"));
        setStatus(t("tx.checkingWithdrawal"));
        const allowance = await publicClient().readContract({
          address: vault,
          abi: stockifyVaultAbi,
          functionName: "allowance",
          args: [owner, router],
        });
        if (allowance < burn) {
          setProgress(t("tx.approveInWallet"));
          await send(vault, { abi: stockifyVaultAbi, functionName: "approve", args: [router, maxUint256] }, t("tx.label.approval"));
        }
        const preview = await publicClient().readContract({ address: vault, abi: stockifyVaultAbi, functionName: "previewRedeem", args: [burn] });
        const minAssets = (preview * 99n) / 100n;
        setProgress(t("tx.confirmWithdraw"));
        await send(router, { abi: stockifyRouterAbi, functionName: "redeem", args: [vault, burn, owner, minAssets] }, t("tx.label.usdgWithdrawal"));
      }
      setStatus(t("tx.confirmedUpdating"));
      await refresh();
      setStatus(t("tx.complete"));
    } catch (e) {
      setStatus("");
      setError(txErrorMessage(e, t));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  const value =
    shares != null && assets != null
      ? Number(formatUnits(assets, 6))
      : null;
  const submitLabel = (
    <>
      <span className="managed-progress-spinner" aria-hidden="true" />
      {progress}
    </>
  );

  return (
    <div className="wallet-portfolio wallet-portfolio-compact">
      <section className="wallet-vault-actions managed-vault-actions">
        {owner && shares !== null && shares !== 0n ? (
          <div className="earn-account-summary">
            <p className="eyebrow">{t("actions.positionEyebrow")}</p>
            <strong>
              {value === null ? "–" : value.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 })}
              <small>USDG</small>
            </strong>
            <div className="earn-account-summary-meta">
              <span>{t("actions.shares", { n: fmt(shares, shareDecimals) })}</span>
              <Link href="/portfolio">{t("actions.portfolio")}</Link>
            </div>
          </div>
        ) : (
          <div className="single-vault-wallet-intro">
            <h2>{t("actions.firstDeposit")}</h2>
            <p>{owner ? t("actions.noPosition") : t("actions.connectIntro")}</p>
          </div>
        )}
        <div className="tabs vault-action-tabs" role="tablist" aria-label={t("actions.tabsAria")}>
          <button type="button" role="tab" disabled={busy} aria-selected={mode === "deposit"} className={mode === "deposit" ? "active" : ""} onClick={() => setMode("deposit")}>
            {t("actions.deposit")}
          </button>
          <button type="button" role="tab" disabled={busy} aria-selected={mode === "withdraw"} className={mode === "withdraw" ? "active" : ""} onClick={() => setMode("withdraw")}>
            {t("actions.withdraw")}
          </button>
        </div>
        {mode === "deposit" ? (
          <>
            <label className="amount-box amount-box-input" htmlFor="stockify-amount">
              <div className="amount-box-top">
                <span>{t("actions.youDeposit")}</span>
                <span>
                  {t("actions.balance")} <b className="mono">{usdgBalance === null ? "–" : fmt(usdgBalance, 6)}</b> ·{" "}
                  <button type="button" className="max-link" disabled={usdgBalance === null || busy} onClick={() => usdgBalance !== null && setAmount(formatUnits(usdgBalance, 6))}>
                    {t("actions.max")}
                  </button>
                </span>
              </div>
              <div className="wallet-amount-main">
                <input id="stockify-amount" inputMode="decimal" disabled={busy} placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <span>USDG</span>
              </div>
            </label>
            <div className="wallet-quote-row" aria-live="polite">
              <span>{t("actions.youReceive")}</span>
              <strong className="mono">{t("actions.vaultSharesValue", { value: quoteShares != null ? `≈ ${fmt(quoteShares, shareDecimals)}` : "–" })}</strong>
            </div>
            {owner ? (
              <button className="btn btn-primary managed-submit" disabled={busy} aria-busy={busy} onClick={() => void run("deposit")}>
                {busy ? submitLabel : t("actions.deposit")}
              </button>
            ) : (
              <button className="btn btn-primary managed-submit" disabled={!ready} onClick={() => void connect()}>
                {t("actions.connect")}
              </button>
            )}
          </>
        ) : (
          <>
            <label htmlFor="stockify-percent">{t("actions.portion")}</label>
            <div className="managed-input">
              <input id="stockify-percent" inputMode="decimal" value={percent} onChange={(e) => setPercent(e.target.value)} />
              <span>%</span>
            </div>
            <div className="managed-presets">
              {[25, 50, 75, 100].map((p) => (
                <button key={p} type="button" onClick={() => setPercent(String(p))}>
                  {p === 100 ? t("actions.max") : `${p}%`}
                </button>
              ))}
            </div>
            {owner ? (
              <button className="btn btn-primary managed-submit" disabled={busy || !shares} aria-busy={busy} onClick={() => void run("withdraw")}>
                {busy ? submitLabel : t("actions.withdraw")}
              </button>
            ) : (
              <button className="btn btn-primary managed-submit" disabled={!ready} onClick={() => void connect()}>
                {t("actions.connect")}
              </button>
            )}
          </>
        )}
        {status || hash || error ? (
          <div className="managed-transaction-result">
            {status ? (
              <p className="managed-transaction-progress" role="status" aria-live="polite">
                {status}
              </p>
            ) : null}
            {hash ? (
              <a href={explorerTx(hash)} target="_blank" rel="noreferrer">
                {t("actions.viewTx")}
              </a>
            ) : null}
            {error ? (
              <p className="managed-error" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        ) : null}
        <details>
          <summary>{t("actions.how")}</summary>
          <p>{t("actions.howBody")}</p>
        </details>
      </section>
    </div>
  );
}
