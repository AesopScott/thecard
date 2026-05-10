"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { subscribeToLeaderboard, type LeaderboardEntry } from "@/lib/user-store";
import {
  ACTIVE_SEASON,
  GLOBAL_LEAGUE,
  SEASON_BANKROLL_EVENT,
  STARTING_BANKROLL,
  buildSeasonLeaderboard,
  getMembership,
  getSeasonNumber,
  getSeasonStatus,
  getUserSeasonMembership,
  initGlobalLeague,
} from "@/lib/season-store";
import { SeasonBanner } from "@/components/season-banner";
import type { SeasonLeaderboardEntry } from "@thecard/types";

type Tab = "season" | "calibration";

// ── Season tab ──────────────────────────────────────────────────────────────

function SeasonTab() {
  const { user, verificationRequired } = useAuth();
  const [membership, setMembership] = useState(() => getMembership(GLOBAL_LEAGUE.id));
  const [board, setBoard] = useState<SeasonLeaderboardEntry[]>(() => {
    const membership = getMembership(GLOBAL_LEAGUE.id);
    return buildSeasonLeaderboard(membership.currentBankroll, membership.betCount);
  });
  const status = getSeasonStatus(ACTIVE_SEASON);

  useEffect(() => {
    initGlobalLeague();
    function refresh() {
      const applyMembership = (m: ReturnType<typeof getMembership>) => {
        setMembership(m);
        setBoard(buildSeasonLeaderboard(m.currentBankroll, m.betCount));
      };
      if (user && !verificationRequired) {
        getUserSeasonMembership(user.uid)
          .then(applyMembership)
          .catch(() => applyMembership(getMembership(GLOBAL_LEAGUE.id)));
        return;
      }
      const m = getMembership(GLOBAL_LEAGUE.id);
      applyMembership(m);
    }
    refresh();
    window.addEventListener(SEASON_BANKROLL_EVENT, refresh);
    return () => window.removeEventListener(SEASON_BANKROLL_EVENT, refresh);
  }, [user, verificationRequired]);

  const pnl = membership.currentBankroll - STARTING_BANKROLL;
  const pnlColor = pnl >= 0 ? "var(--color-card-yes)" : "var(--color-card-no)";
  const pnlSign = pnl >= 0 ? "+" : "";

  return (
    <div className="flex flex-col gap-4">
      <SeasonBanner variant="full" />

      {status === "upcoming" && (
        <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] px-4 py-8 flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-semibold text-[var(--color-card-text)]">Season {getSeasonNumber(ACTIVE_SEASON)} preview</p>
          <p className="text-xs text-[var(--color-card-muted)] max-w-xs leading-relaxed">
            Everyone enters with $1,000. Grow it highest to win a share of the prize pool.
            The leaderboard locks in on{" "}
            {ACTIVE_SEASON.startDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}.
          </p>
        </div>
      )}

      {/* Your stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-3 flex flex-col gap-0.5">
          <span className="text-[10px] text-[var(--color-card-muted)] uppercase tracking-wider">Bankroll</span>
          <span className="text-base font-black text-[var(--color-card-text)]">
            ${membership.currentBankroll.toLocaleString()}
          </span>
          {pnl !== 0 && (
            <span className="text-[10px] font-semibold" style={{ color: pnlColor }}>
              {pnlSign}${Math.abs(pnl).toLocaleString()}
            </span>
          )}
        </div>
        <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-3 flex flex-col gap-0.5">
          <span className="text-[10px] text-[var(--color-card-muted)] uppercase tracking-wider">Bets</span>
          <span className="text-base font-black text-[var(--color-card-text)]">{membership.betCount}</span>
        </div>
        <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-3 flex flex-col gap-0.5">
          <span className="text-[10px] text-[var(--color-card-muted)] uppercase tracking-wider">League</span>
          <span className="text-base font-black text-[var(--color-card-text)]">Global</span>
        </div>
      </div>

      {/* Leaderboard table */}
      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] divide-y divide-[var(--color-card-border)]">
        <div className="px-4 py-3 grid grid-cols-[24px_1fr_80px_40px] gap-2 items-center">
          <span className="text-[10px] font-semibold text-[var(--color-card-muted)] uppercase tracking-wider">#</span>
          <span className="text-[10px] font-semibold text-[var(--color-card-muted)] uppercase tracking-wider">Player</span>
          <span className="text-[10px] font-semibold text-[var(--color-card-muted)] uppercase tracking-wider text-right">Bankroll</span>
          <span className="text-[10px] font-semibold text-[var(--color-card-muted)] uppercase tracking-wider text-right">Bets</span>
        </div>
        {board.map((entry) => (
          <SeasonRow key={`${entry.displayName}-${entry.rank}`} entry={entry} />
        ))}
      </div>

      {membership.isBust && (
        <div className="rounded-xl border border-[var(--color-card-no)]/30 bg-[var(--color-card-no-dim)] p-4 text-center">
          <p className="text-sm font-bold text-[var(--color-card-no)]">Bust — bankroll reached $0</p>
          <p className="text-xs text-[var(--color-card-muted)] mt-1">Season {getSeasonNumber(ACTIVE_SEASON)} resets {ACTIVE_SEASON.endDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}</p>
        </div>
      )}
    </div>
  );
}

function SeasonRow({ entry }: { entry: SeasonLeaderboardEntry }) {
  const pnl = entry.bankroll - STARTING_BANKROLL;
  const pnlColor = pnl >= 0 ? "var(--color-card-yes)" : "var(--color-card-no)";
  const pnlSign = pnl >= 0 ? "+" : "";
  const highlight = entry.isYou
    ? "bg-[var(--color-brand-primary)]/5"
    : "";

  return (
    <div className={`px-4 py-3 grid grid-cols-[24px_1fr_80px_40px] gap-2 items-center ${highlight}`}>
      <span className="text-xs font-bold text-[var(--color-card-muted)] text-right">{entry.rank}</span>
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 rounded-full bg-[var(--color-card-accent)] flex items-center justify-center text-white text-[9px] font-black shrink-0">
          {entry.avatarInitial}
        </div>
        <span className={`text-xs font-semibold truncate ${entry.isYou ? "text-[var(--color-brand-primary)]" : "text-[var(--color-card-text)]"}`}>
          {entry.displayName}
          {entry.isYou && <span className="ml-1 text-[9px] opacity-60">(you)</span>}
        </span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-xs font-black text-[var(--color-card-text)]">
          ${entry.bankroll.toLocaleString()}
        </span>
        {pnl !== 0 && (
          <span className="text-[9px] font-semibold" style={{ color: pnlColor }}>
            {pnlSign}${Math.abs(pnl).toLocaleString()}
          </span>
        )}
      </div>
      <span className="text-xs text-[var(--color-card-muted)] text-right">{entry.betCount}</span>
    </div>
  );
}

// ── Calibration tab ─────────────────────────────────────────────────────────

function scoreLabel(score: number): string {
  if (score >= 80) return "Sharp";
  if (score >= 65) return "Calibrated";
  if (score >= 50) return "Decent";
  if (score >= 35) return "Noisy";
  return "Overconfident";
}

function CalibrationTab() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToLeaderboard((data) => {
      setEntries(data);
      setLoading(false);
    });
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => { unsub(); clearTimeout(timer); };
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] px-4 py-8 flex justify-center">
        <span className="text-xs text-[var(--color-card-muted)]">Loading…</span>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] divide-y divide-[var(--color-card-border)]">
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--color-card-muted)] uppercase tracking-wider">Forecaster</span>
          <span className="text-xs font-semibold text-[var(--color-card-muted)] uppercase tracking-wider">Calibration</span>
        </div>
        <div className="px-4 py-8 flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-semibold text-[var(--color-card-text)]">No forecasters yet</p>
          <p className="text-xs text-[var(--color-card-muted)] max-w-xs leading-relaxed">
            Make predictions in Forecast. After 5 resolved predictions your calibration score unlocks.
          </p>
          <Link href="/forecast" className="mt-2 text-xs font-semibold text-[var(--color-card-accent)] border border-[var(--color-card-accent-dim)] rounded-lg px-4 py-1.5 hover:bg-[var(--color-card-accent-dim)] transition-colors">
            Start Predicting Free
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] divide-y divide-[var(--color-card-border)]">
      <div className="px-4 py-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--color-card-muted)] uppercase tracking-wider">Forecaster</span>
        <span className="text-xs font-semibold text-[var(--color-card-muted)] uppercase tracking-wider">Calibration</span>
      </div>
      {entries.map((entry, i) => (
        <CalibrationRow key={entry.uid} rank={i + 1} entry={entry} />
      ))}
    </div>
  );
}

function CalibrationRow({ rank, entry }: { rank: number; entry: LeaderboardEntry }) {
  const score = Math.round(entry.calibrationScore);
  const label = scoreLabel(score);
  const scoreColor =
    score >= 75 ? "var(--color-card-yes)" :
    score >= 50 ? "#f59e0b" :
    "var(--color-card-no)";

  return (
    <Link href={`/profile/${entry.username}`} className="px-4 py-3 flex items-center gap-3 hover:bg-[var(--color-surface-2)] transition-colors">
      <span className="text-xs font-bold text-[var(--color-card-muted)] w-5 shrink-0 text-right">{rank}</span>
      <div className="w-7 h-7 rounded-full bg-[var(--color-card-accent)] flex items-center justify-center text-white text-[10px] font-black shrink-0">
        {entry.photoURL
          ? <Image src={entry.photoURL} alt="" width={28} height={28} className="w-full h-full rounded-full object-cover" unoptimized />
          : (entry.displayName[0] ?? "?").toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[var(--color-card-text)] truncate">{entry.displayName}</p>
        <p className="text-[10px] text-[var(--color-card-muted)]">{entry.resolvedCount} predictions</p>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <span className="text-sm font-black" style={{ color: scoreColor }}>{score}</span>
        <span className="text-[10px] text-[var(--color-card-muted)]">{label}</span>
      </div>
    </Link>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

export function LeaderboardClient() {
  const [tab, setTab] = useState<Tab>("season");

  return (
    <div className="flex flex-col gap-4">
      {/* Tab switcher */}
      <div className="flex rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-1 gap-1">
        {(["season", "calibration"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 rounded-lg py-2 text-xs font-bold transition-all"
            style={{
              backgroundColor: tab === t ? "var(--color-brand-primary)" : "transparent",
              color: tab === t ? "#fff" : "var(--color-card-muted)",
            }}
          >
            {t === "season" ? "🏆 Season" : "📊 Calibration"}
          </button>
        ))}
      </div>

      {tab === "season" ? <SeasonTab /> : <CalibrationTab />}
    </div>
  );
}
