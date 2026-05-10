"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { settleUserMarket } from "@/lib/settlement";
import type { Sport } from "@thecard/types";

interface SettlementMarket {
  id: string;
  title: string;
  sport: Sport;
}

interface SettlementPanelProps {
  markets: SettlementMarket[];
}

const ADMIN_EMAILS = new Set(["scott@aesopacademy.org"]);

export function SettlementPanel({ markets }: SettlementPanelProps) {
  const { user } = useAuth();
  const [workingMarketId, setWorkingMarketId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = useMemo(
    () => Boolean(user?.email && ADMIN_EMAILS.has(user.email.toLowerCase())),
    [user?.email],
  );

  if (!user || !isAdmin) return null;

  async function settle(market: SettlementMarket, outcome: "yes" | "no") {
    if (!user || workingMarketId) return;
    setWorkingMarketId(market.id);
    setError(null);
    setMessage(null);
    try {
      const result = await settleUserMarket({
        uid: user.uid,
        marketId: market.id,
        sport: market.sport,
        outcome,
      });
      setMessage(
        `${market.title}: ${outcome.toUpperCase()} settled. Paid $${result.payout.toFixed(2)} across ${result.settledPositions} position${result.settledPositions === 1 ? "" : "s"}.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Settlement failed.");
    } finally {
      setWorkingMarketId(null);
    }
  }

  return (
    <section className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-2)] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-[var(--color-card-text)]">Settlement Tools</h2>
          <p className="text-xs text-[var(--color-text-muted)]">Admin-only current-user settlement.</p>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">
          Test
        </span>
      </div>

      {(message || error) && (
        <p className={`rounded-lg px-3 py-2 text-xs font-semibold ${
          error
            ? "bg-red-500/10 text-red-300 border border-red-500/30"
            : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
        }`}>
          {error ?? message}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {markets.map((market) => (
          <div key={market.id} className="flex items-center gap-2 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-2.5">
            <p className="min-w-0 flex-1 truncate text-xs font-semibold text-[var(--color-card-text)]">
              {market.title}
            </p>
            <button
              type="button"
              onClick={() => settle(market, "yes")}
              disabled={workingMarketId !== null}
              className="h-8 w-12 rounded-md border border-emerald-500/40 text-xs font-black text-emerald-300 disabled:opacity-50"
            >
              YES
            </button>
            <button
              type="button"
              onClick={() => settle(market, "no")}
              disabled={workingMarketId !== null}
              className="h-8 w-12 rounded-md border border-red-500/40 text-xs font-black text-red-300 disabled:opacity-50"
            >
              NO
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
