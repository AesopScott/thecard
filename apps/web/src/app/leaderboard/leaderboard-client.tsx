"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { subscribeToLeaderboard, type LeaderboardEntry } from "@/lib/user-store";

function scoreLabel(score: number): string {
  if (score >= 80) return "Sharp";
  if (score >= 65) return "Calibrated";
  if (score >= 50) return "Decent";
  if (score >= 35) return "Noisy";
  return "Overconfident";
}

export function LeaderboardClient() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToLeaderboard((data) => {
      setEntries(data);
      setLoading(false);
    });
    // If Firestore isn't configured, unsub is a no-op — stop loading after mount
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => {
      unsub();
      clearTimeout(timer);
    };
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
            Make predictions in Practice Mode to build your track record.
            After 5 resolved predictions your calibration score unlocks and you&apos;ll appear here.
          </p>
          <Link
            href="/learn"
            className="mt-2 text-xs font-semibold text-[var(--color-card-accent)] border border-[var(--color-card-accent-dim)] rounded-lg px-4 py-1.5 hover:bg-[var(--color-card-accent-dim)] transition-colors"
          >
            Start in Practice Mode
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
        <LeaderboardRow key={entry.uid} rank={i + 1} entry={entry} />
      ))}
    </div>
  );
}

function LeaderboardRow({ rank, entry }: { rank: number; entry: LeaderboardEntry }) {
  const score = Math.round(entry.calibrationScore);
  const label = scoreLabel(score);
  const scoreColor =
    score >= 75 ? "var(--color-card-yes)" :
    score >= 50 ? "#f59e0b" :
    "var(--color-card-no)";

  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <span className="text-xs font-bold text-[var(--color-card-muted)] w-5 shrink-0 text-right">
        {rank}
      </span>
      <div className="w-7 h-7 rounded-full bg-[var(--color-card-accent)] flex items-center justify-center text-white text-[10px] font-black shrink-0">
        {entry.photoURL
          ? <img src={entry.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
          : (entry.displayName[0] ?? "?").toUpperCase()
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[var(--color-card-text)] truncate">
          {entry.displayName}
        </p>
        <p className="text-[10px] text-[var(--color-card-muted)]">
          {entry.resolvedCount} predictions
        </p>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <span className="text-sm font-black" style={{ color: scoreColor }}>
          {score}
        </span>
        <span className="text-[10px] text-[var(--color-card-muted)]">{label}</span>
      </div>
    </div>
  );
}
