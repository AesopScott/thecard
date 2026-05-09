"use client";

import { useState, useEffect } from "react";
import type { Market, Odds } from "@thecard/types";
import { exchange } from "@/lib/exchange";
import { OddsPill } from "./odds-pill";

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  const [odds, setOdds] = useState<Odds | null>(null);

  useEffect(() => {
    exchange.getOdds(market.id).then(setOdds);
    const unsub = exchange.subscribeToMarket(market.id, setOdds);
    return unsub;
  }, [market.id]);

  const sportLabel = market.sport.toUpperCase();

  return (
    <article className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 flex flex-col gap-3">
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
        {odds && (
          <div className="flex flex-col items-end gap-1 shrink-0">
            <OddsPill probability={odds.yes} side="yes" />
            <span className="text-[10px] text-[var(--color-card-muted)]">YES</span>
          </div>
        )}
      </div>

      {odds && (
        <div className="flex gap-2">
          <button className="flex-1 rounded-lg bg-[var(--color-card-yes-dim)] text-[var(--color-card-yes)] font-semibold text-sm py-2 hover:opacity-80 transition-opacity">
            YES · {Math.round(odds.yes * 100)}¢
          </button>
          <button className="flex-1 rounded-lg bg-[var(--color-card-no-dim)] text-[var(--color-card-no)] font-semibold text-sm py-2 hover:opacity-80 transition-opacity">
            NO · {Math.round(odds.no * 100)}¢
          </button>
        </div>
      )}
    </article>
  );
}
