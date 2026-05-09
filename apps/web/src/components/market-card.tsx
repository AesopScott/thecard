"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import type { Market, Odds } from "@thecard/types";
import { exchange } from "@/lib/exchange";
import { OddsPill } from "./odds-pill";

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  const [odds, setOdds] = useState<Odds | null>(null);
  const [betPrompt, setBetPrompt] = useState(false);

  useEffect(() => {
    exchange.getOdds(market.id).then(setOdds);
    const unsub = exchange.subscribeToMarket(market.id, setOdds);
    return unsub;
  }, [market.id]);

  const sportLabel = market.sport.toUpperCase();
  const yesPct = odds ? Math.round(odds.yes * 100) : null;
  const noPct = odds ? Math.round(odds.no * 100) : null;

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

        {/* Odds pill + label */}
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

      {/* YES / NO buttons */}
      {odds && (
        <div className="flex gap-2">
          <button
            onClick={() => setBetPrompt(true)}
            className="flex-1 rounded-lg bg-[var(--color-card-yes-dim)] text-[var(--color-card-yes)] font-semibold text-sm py-2.5 hover:opacity-80 active:scale-95 transition-all"
          >
            YES · {yesPct}¢
          </button>
          <button
            onClick={() => setBetPrompt(true)}
            className="flex-1 rounded-lg bg-[var(--color-card-no-dim)] text-[var(--color-card-no)] font-semibold text-sm py-2.5 hover:opacity-80 active:scale-95 transition-all"
          >
            NO · {noPct}¢
          </button>
        </div>
      )}

      {/* What do these prices mean? */}
      <p className="text-[10px] text-[var(--color-card-muted)] leading-relaxed">
        Prices are cents on the dollar — 62¢ YES means the crowd thinks there&apos;s a
        62% chance this happens. Buy YES if you agree; buy NO if you don&apos;t.
        Pays $1 per contract if you&apos;re right.
      </p>

      {/* Bet prompt — shown when YES/NO is clicked before auth is wired */}
      <AnimatePresence>
        {betPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3 flex flex-col gap-2"
          >
            <p className="text-xs font-semibold text-[var(--color-card-text)]">
              Real-money betting coming soon.
            </p>
            <p className="text-xs text-[var(--color-card-muted)] leading-snug">
              We&apos;re connecting to Kalshi&apos;s regulated exchange. While you wait,
              build your track record in Practice Mode — same markets, no money at risk.
            </p>
            <div className="flex gap-2 mt-1">
              <Link
                href="/learn"
                className="flex-1 text-center text-xs font-semibold text-[var(--color-card-accent)] border border-[var(--color-card-accent-dim)] rounded-lg py-1.5 hover:bg-[var(--color-card-accent-dim)] transition-colors"
              >
                Try Practice Mode
              </Link>
              <button
                onClick={() => setBetPrompt(false)}
                className="text-xs text-[var(--color-card-muted)] px-3 py-1.5 hover:text-[var(--color-card-text)] transition-colors"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </article>
  );
}
