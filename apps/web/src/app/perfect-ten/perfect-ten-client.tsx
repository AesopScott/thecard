"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  CURRENT_CONTEST,
  getPick,
  getStoredPick,
  setPick,
  savePickDraft,
  submitStoredPicks,
  isLocked,
  countdownToLock,
  formatDollars,
  P10_PICK_EVENT,
} from "@/lib/perfect-ten-store";
import { exchange } from "@/lib/exchange";
import { useAuth } from "@/contexts/auth-context";
import { EmailVerificationNotice } from "@/components/email-verification-notice";
import { SignInSheet } from "@/components/sign-in-sheet";
import type { Market, PerfectTenPick } from "@thecard/types";

const SPORT_ICONS: Record<string, string> = {
  nfl: "🏈", nba: "🏀", mlb: "⚾", nhl: "🏒",
  ncaaf: "🏈", ncaab: "🏀", soccer: "⚽", ufc: "🥊", other: "🏅",
};

// ── Market pick row ──────────────────────────────────────────────────────────

function MarketPickRow({
  index,
  market,
  pick,
  locked,
  onPick,
}: {
  index: number;
  market: Market;
  pick: "yes" | "no" | undefined;
  locked: boolean;
  onPick: (marketId: string, side: "yes" | "no") => void;
}) {
  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <span className="text-xs font-black text-[var(--color-text-muted)] w-5 shrink-0 text-right">
        {index + 1}
      </span>
      <span className="text-base shrink-0">{SPORT_ICONS[market.sport] ?? "🏅"}</span>
      <p className="flex-1 text-sm font-semibold text-[var(--color-card-text)] leading-snug min-w-0 pr-1">
        {market.title}
      </p>
      <div className="flex gap-1.5 shrink-0">
        {(["yes", "no"] as const).map((side) => {
          const chosen = pick === side;
          const color = side === "yes" ? "var(--color-card-yes)" : "var(--color-card-no)";
          const dimColor = side === "yes" ? "var(--color-card-yes-dim)" : "var(--color-card-no-dim)";
          return (
            <button
              key={side}
              disabled={locked}
              onClick={() => onPick(market.id, side)}
              className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: chosen ? dimColor : "transparent",
                color: chosen ? color : "var(--color-text-muted)",
                border: `1px solid ${chosen ? `color-mix(in srgb, ${color} 40%, transparent)` : "var(--color-card-border)"}`,
              }}
            >
              {side}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function PerfectTenClient() {
  const { user, verificationRequired } = useAuth();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [pick, setPicked] = useState<PerfectTenPick>(() => getPick(CURRENT_CONTEST.id));
  const [countdown, setCountdown] = useState(countdownToLock);
  const [locked, setLocked] = useState(isLocked);
  const [submitted, setSubmitted] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    exchange.getMarkets({ limit: 10 }).then((all) => {
      const ids = new Set(CURRENT_CONTEST.marketIds);
      const ordered = CURRENT_CONTEST.marketIds
        .map((id) => all.find((m) => m.id === id))
        .filter((m): m is Market => !!m);
      // Fall back: any markets not filtered by IDs
      if (ordered.length === 0) setMarkets(all.filter((m) => ids.has(m.id)));
      else setMarkets(ordered);
    });
  }, []);

  const refresh = useCallback(() => {
    const p = getPick(CURRENT_CONTEST.id);
    setPicked(p);
    setSubmitted(p.isSubmitted);
    setLocked(isLocked());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(P10_PICK_EVENT, refresh);
    return () => window.removeEventListener(P10_PICK_EVENT, refresh);
  }, [refresh]);

  useEffect(() => {
    if (!user || verificationRequired) return;
    getStoredPick(user.uid, CURRENT_CONTEST.id)
      .then((stored) => {
        setPicked(stored);
        setSubmitted(stored.isSubmitted);
      })
      .catch(() => setSaveError("Could not load your saved Perfect 10 entry."));
  }, [user, verificationRequired]);

  // Countdown ticker
  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(countdownToLock());
      setLocked(isLocked());
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  function handlePick(marketId: string, side: "yes" | "no") {
    if (!user) { setSignInOpen(true); return; }
    if (verificationRequired) return;
    const updated = setPick(CURRENT_CONTEST.id, marketId, side);
    setPicked(updated);
    savePickDraft(user.uid, updated).catch(() => {
      setSaveError("Pick saved locally, but could not sync to your account.");
    });
  }

  async function handleSubmit() {
    if (!user) { setSignInOpen(true); return; }
    if (verificationRequired) return;
    const result = await submitStoredPicks(user.uid, CURRENT_CONTEST.id).catch(() => {
      setSaveError("Could not lock your picks. Try again.");
      return null;
    });
    if (result) {
      setPicked(result);
      setSubmitted(true);
    }
  }

  const pickedCount = Object.keys(pick.picks).length;
  const total = CURRENT_CONTEST.marketIds.length;
  const allPicked = pickedCount === total;

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] pt-8 pb-32">
      <div className="max-w-lg mx-auto px-4">

        {/* Header */}
        <div className="mb-6">
          <Link href="/card" className="text-sm text-[var(--color-brand-primary)] hover:underline mb-4 inline-block">
            ← Back
          </Link>

          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <p className="text-[10px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest mb-1">
                🔥 Perfect 10 · {CURRENT_CONTEST.weekLabel}
              </p>
              <h1 className="text-4xl font-display font-black tracking-tight text-[var(--color-brand-primary)]">
                {formatDollars(CURRENT_CONTEST.jackpotAmount)}
              </h1>
              {CURRENT_CONTEST.rolloverWeeks > 1 && (
                <p className="text-xs font-semibold text-[var(--color-text-muted)] mt-0.5">
                  {CURRENT_CONTEST.rolloverWeeks}-week rollover · nobody has hit all 10
                </p>
              )}
            </div>
            <div className="flex flex-col items-end shrink-0 text-right">
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">
                {locked ? "Picks" : "Locks in"}
              </span>
              <span className={`text-sm font-bold ${locked ? "text-[var(--color-card-no)]" : "text-[var(--color-card-text)]"}`}>
                {locked ? "Locked" : countdown}
              </span>
            </div>
          </div>

          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            Pick YES or NO on all 10 markets. Get every one right and win the jackpot.
            Picks lock {CURRENT_CONTEST.locksAt.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} at 11:59 PM ET.
          </p>
        </div>

        {/* Progress bar */}
        {!user && (
          <div className="mb-4 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
            <p className="text-sm font-bold text-[var(--color-card-text)]">Sign in to lock your entry</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">You can preview the markets, but Perfect 10 entries are account-bound.</p>
            <button
              type="button"
              onClick={() => setSignInOpen(true)}
              className="mt-3 rounded-lg bg-[var(--color-brand-primary)] px-4 py-2 text-xs font-bold text-white"
            >
              Sign in
            </button>
          </div>
        )}
        {user && verificationRequired && (
          <div className="mb-4">
            <EmailVerificationNotice compact />
          </div>
        )}
        {saveError && (
          <p className="mb-4 rounded-lg border border-[var(--color-card-no)]/30 bg-[var(--color-card-no-dim)] px-3 py-2 text-xs text-[var(--color-card-no)]">
            {saveError}
          </p>
        )}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[var(--color-text-muted)]">
              {submitted ? "Picks submitted" : `${pickedCount} of ${total} picked`}
            </span>
            {submitted && (
              <span className="text-[var(--color-card-yes)] font-bold">Locked in ✓</span>
            )}
          </div>
          <div className="h-1.5 rounded-full bg-[var(--color-card-border)] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[var(--color-brand-primary)]"
              initial={{ width: 0 }}
              animate={{ width: `${(pickedCount / total) * 100}%` }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            />
          </div>
        </div>

        {/* Markets list */}
        <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] divide-y divide-[var(--color-card-border)] mb-4">
          {markets.length === 0
            ? Array.from({ length: 10 }, (_, i) => (
                <div key={i} className="px-4 py-4 flex items-center gap-3 animate-pulse">
                  <div className="w-5 h-3 bg-[var(--color-card-border)] rounded" />
                  <div className="flex-1 h-3 bg-[var(--color-card-border)] rounded" />
                </div>
              ))
            : markets.map((market, i) => (
                <MarketPickRow
                  key={market.id}
                  index={i}
                  market={market}
                  pick={pick.picks[market.id]}
                  locked={locked || submitted || verificationRequired}
                  onPick={handlePick}
                />
              ))}
        </div>

        {/* Submit / status */}
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="submitted"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-[var(--color-card-yes)]/30 bg-[var(--color-card-yes-dim)] p-4 text-center flex flex-col gap-1"
            >
              <p className="text-sm font-bold text-[var(--color-card-yes)]">
                Your Perfect 10 picks are locked in!
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Results after all 10 markets resolve. Good luck.
              </p>
            </motion.div>
          ) : locked ? (
            <motion.div
              key="locked"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 text-center"
            >
              <p className="text-sm font-semibold text-[var(--color-text-muted)]">
                Picks are locked for this week.
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Come back next week for a fresh contest.
              </p>
            </motion.div>
          ) : (
            <motion.div key="submit" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <button
                onClick={handleSubmit}
                disabled={!allPicked || verificationRequired}
                className="w-full rounded-xl font-bold text-sm py-3.5 transition-all active:scale-[0.98] disabled:opacity-40"
                style={{
                  backgroundColor: allPicked
                    ? "var(--color-brand-primary)"
                    : "var(--color-card-surface)",
                  color: allPicked ? "#fff" : "var(--color-text-muted)",
                  border: "1px solid var(--color-card-border)",
                }}
              >
                {allPicked
                  ? `Lock in my Perfect 10 picks`
                  : `Pick ${total - pickedCount} more to submit`}
              </button>
              <p className="text-[10px] text-center text-[var(--color-text-muted)] mt-2">
                One entry per week · Free · No purchase required
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* How it works */}
        <div className="mt-8 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 flex flex-col gap-2">
          <p className="text-[10px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest">
            How it works
          </p>
          <div className="flex flex-col gap-1.5 text-xs text-[var(--color-text-muted)] leading-relaxed">
            <p>Pick YES or NO on all 10 markets before they lock. If every one resolves in your favor — you win the jackpot.</p>
            <p>Nobody wins? The jackpot rolls over. It grows every week until someone hits all 10.</p>
            <p>New 10 markets drop every Monday. One free entry per week, no betting required.</p>
          </div>
        </div>

        <SignInSheet open={signInOpen} onClose={() => setSignInOpen(false)} />
      </div>
    </div>
  );
}
