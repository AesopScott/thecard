"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Market, Odds } from "@thecard/types";
import { exchange } from "@/lib/exchange";
import { useAuth } from "@/contexts/auth-context";
import { SignInSheet } from "./sign-in-sheet";
import { OrderSheet } from "./order-sheet";
import { EmailVerificationNotice } from "./email-verification-notice";
import type { HostTake } from "@/lib/editorial";

interface MarketCardProps {
  market: Market;
  hostTake?: HostTake;
  initialOdds?: Odds;
  signal?: string;
  watched?: boolean;
  selectedSide?: "yes" | "no" | null;
  conviction?: string;
  edgeLabel?: string;
  movement?: string;
  signalStack?: string[];
  onToggleWatch?: () => void;
  onAddToTicket?: (side: "yes" | "no") => void;
  onExplain?: () => void;
}

export function MarketCard({
  market,
  hostTake,
  initialOdds,
  signal,
  watched = false,
  selectedSide = null,
  conviction,
  edgeLabel,
  movement,
  signalStack = [],
  onToggleWatch,
  onAddToTicket,
  onExplain,
}: MarketCardProps) {
  const { user, verificationRequired, loading: authLoading } = useAuth();
  const [odds, setOdds] = useState<Odds | null>(initialOdds ?? null);
  const [orderSide, setOrderSide] = useState<"yes" | "no" | null>(null);

  useEffect(() => {
    exchange.getOdds(market.id).then(setOdds);
    const unsub = exchange.subscribeToMarket(market.id, setOdds);
    return unsub;
  }, [market.id]);

  const sportLabel = market.sport.toUpperCase();
  const yesPct = odds ? Math.round(odds.yes * 100) : null;
  const noPct = odds ? Math.round(odds.no * 100) : null;

  function handleSide(side: "yes" | "no") {
    if (!authLoading) setOrderSide(side);
  }

  return (
    <article
      className="flex flex-col gap-3 overflow-hidden rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] transition-all hover:border-[var(--color-brand-primary)]/30 hover:shadow-lg"
      style={{ borderTopWidth: "3px", borderTopColor: `var(--sport-color-${market.sport}, var(--color-brand-primary))` }}
    >
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-primary)]">{sportLabel}</span>
            {signal && <span className="rounded-md border border-[var(--color-card-border)] px-2 py-0.5 text-[10px] font-black uppercase text-[var(--color-card-muted)]">{signal}</span>}
            {conviction && <span className="rounded-md bg-[var(--color-brand-primary)] px-2 py-0.5 text-[10px] font-black uppercase text-white">{conviction}</span>}
          </div>
          <h3 className="text-xl font-display font-black leading-tight text-[var(--color-card-text)]">{market.title}</h3>
          <p className="text-xs leading-relaxed text-[var(--color-card-muted)]">{market.subtitle}</p>
          {(onToggleWatch || onExplain) && (
            <div className="mt-1 flex flex-wrap gap-2">
              {onToggleWatch && (
                <button
                  onClick={onToggleWatch}
                  className={`w-fit rounded-lg border px-2 py-1 text-[10px] font-black uppercase transition-colors ${
                    watched
                      ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]"
                      : "border-[var(--color-card-border)] text-[var(--color-card-muted)] hover:border-[var(--color-brand-primary)]/50"
                  }`}
                >
                  {watched ? "Watching" : "Watch"}
                </button>
              )}
              {onExplain && (
                <button onClick={onExplain} className="w-fit rounded-lg border border-[var(--color-card-border)] px-2 py-1 text-[10px] font-black uppercase text-[var(--color-card-muted)] transition-colors hover:border-[var(--color-brand-primary)]/50">
                  Explain
                </button>
              )}
            </div>
          )}
        </div>

        {yesPct !== null && (
          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="text-2xl font-display font-black text-[var(--color-card-yes)]">{yesPct}c</div>
            <span className="text-[10px] font-medium text-[var(--color-card-muted)]">crowd</span>
          </div>
        )}
      </div>

      {yesPct !== null && noPct !== null && (
        <div className="flex items-center gap-2.5 px-4">
          <span className="w-6 shrink-0 text-right text-xs font-bold text-[var(--color-card-no)]">{noPct}%</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-2)] shadow-sm">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-[var(--color-card-yes)] to-[var(--color-brand-secondary)]" animate={{ width: `${yesPct}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
          </div>
          <span className="w-6 shrink-0 text-xs font-bold text-[var(--color-card-yes)]">{yesPct}%</span>
        </div>
      )}

      {(edgeLabel || movement || signalStack.length > 0) && (
        <div className="mx-4 grid gap-2 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-surface-2)] p-3">
          <div className="grid grid-cols-2 gap-2">
            {edgeLabel && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-card-muted)]">Edge</p>
                <p className="mt-1 text-sm font-black text-[var(--color-card-text)]">{edgeLabel}</p>
              </div>
            )}
            {movement && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-card-muted)]">Move</p>
                <p className="mt-1 text-sm font-black text-[var(--color-card-text)]">{movement}</p>
              </div>
            )}
          </div>
          {signalStack.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {signalStack.slice(0, 3).map((item) => (
                <span key={item} className="rounded-md bg-[var(--color-card-bg)] px-2 py-1 text-[10px] font-bold text-[var(--color-card-muted)]">{item}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {hostTake?.text && (
        <div className="flex gap-3 border-t border-[var(--color-card-border)] px-4 pt-3">
          <div className="h-12 w-0.5 rounded-full bg-gradient-to-b from-[var(--color-brand-primary)] to-transparent" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-brand-primary)]">The Card{hostTake.source === "claude" && <span className="ml-1 text-[var(--color-text-muted)] opacity-60">AI</span>}</span>
            <p className="text-xs italic leading-relaxed text-[var(--color-card-muted)]">&ldquo;{hostTake.text}&rdquo;</p>
          </div>
        </div>
      )}

      {odds && (
        <div className="flex flex-col gap-2 px-4 pb-4">
          {onAddToTicket && (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => onAddToTicket("yes")} className={`rounded-lg border px-3 py-2 text-xs font-black transition-all ${selectedSide === "yes" ? "border-[var(--color-card-yes)] bg-[var(--color-card-yes)] text-white" : "border-[var(--color-card-border)] bg-[var(--color-card-yes-dim)] text-[var(--color-card-yes)]"}`}>Add YES</button>
              <button onClick={() => onAddToTicket("no")} className={`rounded-lg border px-3 py-2 text-xs font-black transition-all ${selectedSide === "no" ? "border-[var(--color-card-no)] bg-[var(--color-card-no)] text-white" : "border-[var(--color-card-border)] bg-[var(--color-card-no-dim)] text-[var(--color-card-no)]"}`}>Add NO</button>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => handleSide("yes")} disabled={authLoading} className="flex-1 rounded-lg bg-[var(--color-card-yes-dim)] py-3 text-sm font-bold text-[var(--color-card-yes)] transition-all hover:bg-[var(--color-success)] hover:text-white hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-40">YES - {yesPct}c</button>
            <button onClick={() => handleSide("no")} disabled={authLoading} className="flex-1 rounded-lg bg-[var(--color-card-no-dim)] py-3 text-sm font-bold text-[var(--color-card-no)] transition-all hover:bg-[var(--color-danger)] hover:text-white hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-40">NO - {noPct}c</button>
          </div>
        </div>
      )}

      <div className="border-t border-[var(--color-card-border)] px-4 pb-4 pt-2">
        <p className="text-[10px] leading-relaxed text-[var(--color-text-muted)]">Prices are cents on the dollar. A 62c YES price means a 62% chance this happens.</p>
      </div>

      {orderSide && !user && <SignInSheet open onClose={() => setOrderSide(null)} />}
      {orderSide && user && verificationRequired && (
        <div className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-sm">
          <EmailVerificationNotice compact />
        </div>
      )}
      {orderSide && user && !verificationRequired && odds && <OrderSheet open market={market} side={orderSide} odds={odds} onClose={() => setOrderSide(null)} />}
    </article>
  );
}
