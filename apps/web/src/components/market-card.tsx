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
    <article className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 flex flex-col gap-3">

      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-xs font-semibold text-[var(--color-card-accent)] tracking-widest uppercase">
            {sportLabel}
          </span>
          <h3 className="text-base font-bold text-[var(--color-card-text)] leading-snug">
            {market.title}
          </h3>
          <p className="text-xs text-[var(--color-card-muted)] truncate">
            {market.subtitle}
          </p>
        </div>

        {yesPct !== null && (
          <div className="flex flex-col items-end gap-1 shrink-0">
            <OddsPill probability={odds!.yes} side="yes" />
            <span className="text-[10px] text-[var(--color-card-muted)]">
              crowd says {yesPct}% likely
            </span>
          </div>
        )}
      </div>

      {/* Probability bar */}
      {yesPct !== null && noPct !== null && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--color-card-no)] font-semibold w-6 text-right shrink-0">
            {noPct}%
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-[var(--color-card-border)] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[var(--color-card-yes)]"
              animate={{ width: `${yesPct}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <span className="text-[10px] text-[var(--color-card-yes)] font-semibold w-6 shrink-0">
            {yesPct}%
          </span>
        </div>
      )}

      {/* Host take */}
      {hostTake?.text && (
        <div className="flex gap-2 border-t border-[var(--color-card-border)] pt-2.5">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] font-semibold text-[var(--color-card-accent)] uppercase tracking-widest">
              The Card
              {hostTake.source === "claude" && (
                <span className="ml-1 opacity-50">· AI</span>
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
        <div className="flex gap-2">
          <button
            onClick={() => handleSide("yes")}
            disabled={authLoading}
            className="flex-1 rounded-lg bg-[var(--color-card-yes-dim)] text-[var(--color-card-yes)] font-semibold text-sm py-2.5 hover:opacity-80 active:scale-95 transition-all disabled:opacity-40"
          >
            YES · {yesPct}¢
          </button>
          <button
            onClick={() => handleSide("no")}
            disabled={authLoading}
            className="flex-1 rounded-lg bg-[var(--color-card-no-dim)] text-[var(--color-card-no)] font-semibold text-sm py-2.5 hover:opacity-80 active:scale-95 transition-all disabled:opacity-40"
          >
            NO · {noPct}¢
          </button>
        </div>
      )}

      {/* Prices explainer */}
      <p className="text-[10px] text-[var(--color-card-muted)] leading-relaxed">
        Prices are cents on the dollar — 62¢ YES means a 62% chance this happens.
        Buy YES if you agree; buy NO if you don&apos;t. Pays $1 per contract if right.
      </p>

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
