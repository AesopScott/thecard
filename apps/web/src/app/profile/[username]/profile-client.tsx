"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  getPublicSettledPositions,
  getUserProfileByUsername,
  type SettledPositionRecord,
  type UserProfile,
} from "@/lib/user-store";

interface ProfileClientProps {
  username: string;
}

export function ProfileClient({ username }: ProfileClientProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settledPositions, setSettledPositions] = useState<SettledPositionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getUserProfileByUsername(username)
      .then(async (data) => {
        if (cancelled) return;
        setProfile(data);
        if (data) {
          setSettledPositions(await getPublicSettledPositions(data.uid));
        } else {
          setSettledPositions([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
        <div className="h-24 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)]" />
        <div className="h-28 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-10 text-center">
        <h1 className="text-2xl font-black text-[var(--color-card-text)]">Profile not found</h1>
        <p className="text-sm text-[var(--color-card-muted)]">@{username.toLowerCase()} is not claimed yet.</p>
        <Link href="/leaderboard" className="mx-auto rounded-lg border border-[var(--color-card-border)] px-4 py-2 text-xs font-bold text-[var(--color-card-text)]">
          Back to leaderboard
        </Link>
      </div>
    );
  }

  const score = Math.round(profile.calibrationScore);
  const avgBrier = profile.avgBrierScore === null ? "-" : profile.avgBrierScore.toFixed(3);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-6">
      <header className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-card-accent)] text-xl font-black text-white">
            {profile.photoURL ? (
              <Image src={profile.photoURL} alt="" width={64} height={64} className="h-full w-full object-cover" unoptimized />
            ) : (
              profile.username[0]?.toUpperCase() ?? "?"
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-black text-[var(--color-card-text)]">@{profile.username}</h1>
              {profile.emailVerified && (
                <span className="rounded-full border border-[var(--color-brand-primary)]/30 px-2 py-0.5 text-[10px] font-bold text-[var(--color-brand-primary)]">
                  Verified
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-[var(--color-card-muted)]">
              {profile.teamName ? `${profile.teamName} forecaster` : "Independent forecaster"}
            </p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-3">
        {[
          { label: "Calibration", value: profile.resolvedCount >= 5 ? String(score) : "-" },
          { label: "Brier", value: avgBrier },
          { label: "Resolved", value: String(profile.resolvedCount) },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-3 text-center"
          >
            <p className="text-xl font-black text-[var(--color-card-text)]">{value}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--color-card-muted)]">{label}</p>
          </div>
        ))}
      </section>

      <PositionHistory positions={settledPositions} username={profile.username} />
    </div>
  );
}

function PositionHistory({ positions, username }: { positions: SettledPositionRecord[]; username: string }) {
  const latestPositions = positions.slice(0, 3);
  const stats = positions.reduce(
    (acc, position) => ({
      costBasis: acc.costBasis + position.costBasis,
      payout: acc.payout + position.payout,
      pnl: acc.pnl + position.pnl,
      wins: acc.wins + (position.pnl > 0 ? 1 : 0),
      losses: acc.losses + (position.pnl < 0 ? 1 : 0),
    }),
    { costBasis: 0, payout: 0, pnl: 0, wins: 0, losses: 0 }
  );
  const roi = stats.costBasis > 0 ? (stats.pnl / stats.costBasis) * 100 : 0;
  const winRate = positions.length > 0 ? (stats.wins / positions.length) * 100 : 0;

  return (
    <section className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Position History</p>
        <Link href={`/profile/positions?u=${username}`} className="text-xs font-semibold text-[var(--color-card-muted)] hover:text-[var(--color-brand-primary)]">
          View all
        </Link>
      </div>

      {positions.length === 0 ? (
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-card-muted)]">
          Closed position history will appear here after this player sells a position or a market settles.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                label: "Net P/L",
                value: `${stats.pnl >= 0 ? "+" : ""}$${stats.pnl.toFixed(2)}`,
                tone: stats.pnl >= 0 ? "text-[var(--color-card-yes)]" : "text-[var(--color-card-no)]",
              },
              {
                label: "ROI",
                value: `${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%`,
                tone: roi >= 0 ? "text-[var(--color-card-yes)]" : "text-[var(--color-card-no)]",
              },
              {
                label: "Win Rate",
                value: `${winRate.toFixed(0)}%`,
                tone: "text-[var(--color-card-text)]",
              },
              {
                label: "Volume",
                value: `$${stats.costBasis.toFixed(2)}`,
                tone: "text-[var(--color-card-text)]",
              },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3">
                <p className={`text-lg font-black ${stat.tone}`}>{stat.value}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--color-card-muted)]">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[var(--color-card-muted)]">
            <span>Latest positions</span>
            <span>{positions.length} closed / {stats.wins}W / {stats.losses}L</span>
          </div>

          <div className="flex flex-col gap-2">
            {latestPositions.map((position) => {
              const isProfit = position.pnl >= 0;
              return (
                <div
                  key={position.id}
                  className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[var(--color-card-text)]">
                        {position.marketTitle}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-card-muted)]">
                        {position.side.toUpperCase()} / {position.outcome === "sold" ? "Sold" : `${position.outcome.toUpperCase()} settled`}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`text-sm font-black ${isProfit ? "text-[var(--color-card-yes)]" : "text-[var(--color-card-no)]"}`}>
                        {isProfit ? "+" : ""}${position.pnl.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-[var(--color-card-muted)]">
                        ${position.payout.toFixed(2)} paid
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--color-card-muted)]">
                    <span>{position.contracts.toFixed(1)} contracts / avg {Math.round(position.averagePrice * 100)}c</span>
                    <span>cost ${position.costBasis.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
