"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Market, Odds } from "@thecard/types";
import { exchange } from "@/lib/exchange";
import { useAuth } from "@/contexts/auth-context";
import { OddsPill } from "./odds-pill";
import { SignInSheet } from "./sign-in-sheet";
import { OrderSheet } from "./order-sheet";
import type { HostTake } from "@/lib/editorial";

interface MarketCardProps {
  market: Market;
  hostTake?: HostTake;
}

export function MarketCard({ market, hostTake }: MarketCardProps) {
  const { user, loading: authLoading } = useAuth();
  const [odds, setOdds] = useState<Odds | null>(null);
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
    <article className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] overflow-hidden flex flex-col gap-3 transition-all hover:shadow-lg hover:border-[var(--color-brand-primary)]/30 hover:scale-[1.02]"
      style={{
        borderTopWidth: "3px",
        borderTopColor: `var(--sport-color-${market.sport}, var(--color-brand-primary))`,
      }}>

      {/* Header row with padding */}
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="text-xs font-bold text-[var(--color-brand-primary)] tracking-widest uppercase">
            {sportLabel}
          </span>
          <h3 className="text-xl font-display font-black text-[var(--color-card-text)] leading-tight">
            {market.title}
          </h3>
          <p className="text-xs text-[var(--color-card-muted)] leading-relaxed">
            {market.subtitle}
          </p>
        </div>

        {yesPct !== null && (
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="text-2xl font-display font-black text-[var(--color-card-yes)]">
              {yesPct}¢
            </div>
            <span className="text-[10px] text-[var(--color-card-muted)] font-medium">
              crowd
            </span>
          </div>
        )}
      </div>

      {/* Probability bar */}
      {yesPct !== null && noPct !== null && (
        <div className="px-4 flex items-center gap-2.5">
          <span className="text-xs text-[var(--color-card-no)] font-bold w-6 text-right shrink-0">
            {noPct}%
          </span>
          <div className="flex-1 h-3 rounded-full bg-[var(--color-surface-2)] overflow-hidden shadow-sm">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[var(--color-card-yes)] to-[var(--color-brand-secondary)]"
              animate={{ width: `${yesPct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <span className="text-xs text-[var(--color-card-yes)] font-bold w-6 shrink-0">
            {yesPct}%
          </span>
        </div>
      )}

      {/* Host take */}
      {hostTake?.text && (
        <div className="px-4 pt-3 border-t border-[var(--color-card-border)] flex gap-3">
          <div className="w-0.5 h-12 bg-gradient-to-b from-[var(--color-brand-primary)] to-transparent rounded-full"></div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] font-bold text-[var(--color-brand-primary)] uppercase tracking-widest">
              The Card
              {hostTake.source === "claude" && (
                <span className="ml-1 opacity-60 text-[var(--color-text-muted)]">· AI</span>
              )}
            </span>
            <p className="text-xs text-[var(--color-card-muted)] leading-relaxed italic">
              &ldquo;{hostTake.text}&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* YES / NO buttons */}
      {odds && (
        <div className="px-4 pb-4 flex gap-3">
          <button
            onClick={() => handleSide("yes")}
            disabled={authLoading}
            className="flex-1 rounded-lg bg-[var(--color-card-yes-dim)] hover:bg-[var(--color-success)] text-[var(--color-card-yes)] hover:text-white font-bold text-sm py-3 transition-all hover:shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            YES · {yesPct}¢
          </button>
          <button
            onClick={() => handleSide("no")}
            disabled={authLoading}
            className="flex-1 rounded-lg bg-[var(--color-card-no-dim)] hover:bg-[var(--color-danger)] text-[var(--color-card-no)] hover:text-white font-bold text-sm py-3 transition-all hover:shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            NO · {noPct}¢
          </button>
        </div>
      )}

      {/* Prices explainer */}
      <div className="px-4 pb-4 pt-2 border-t border-[var(--color-card-border)]">
        <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">
          Prices are cents on the dollar — 62¢ YES means a 62% chance this happens.
          Buy YES if you agree; buy NO if you don&apos;t. Pays $1 per contract if right.
        </p>
      </div>

      {/* Auth-gated order flow */}
      {orderSide && !user && (
        <SignInSheet open onClose={() => setOrderSide(null)} />
      )}
      {orderSide && user && odds && (
        <OrderSheet
          open
          market={market}
          side={orderSide}
          odds={odds}
          onClose={() => setOrderSide(null)}
        />
      )}

    </article>
  );
}
