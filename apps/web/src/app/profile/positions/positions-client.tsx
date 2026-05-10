"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  getPublicSettledPositionsPage,
  getUserProfileByUsername,
  type SettledPositionRecord,
  type UserProfile,
} from "@/lib/user-store";

type Filter = "all" | "wins" | "losses" | "settled" | "sold";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "wins", label: "Wins" },
  { id: "losses", label: "Losses" },
  { id: "settled", label: "Settled" },
  { id: "sold", label: "Sold" },
];

const PAGE_SIZE = 100;

export function ProfilePositionsClient() {
  const searchParams = useSearchParams();
  const username = (searchParams.get("u") ?? searchParams.get("username") ?? "").trim().toLowerCase();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [positions, setPositions] = useState<SettledPositionRecord[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<{ closedAtMs: number; id: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getUserProfileByUsername(username)
      .then(async (data) => {
        if (cancelled) return;
        setProfile(data);
        if (!data) {
          setPositions([]);
          setNextCursor(null);
          return;
        }
        const page = await getPublicSettledPositionsPage(data.uid, PAGE_SIZE);
        if (cancelled) return;
        setPositions(page.positions);
        setNextCursor(page.nextCursor);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  const filtered = useMemo(
    () => positions.filter((position) => {
      if (filter === "wins") return position.pnl > 0;
      if (filter === "losses") return position.pnl < 0;
      if (filter === "settled") return position.outcome !== "sold";
      if (filter === "sold") return position.outcome === "sold";
      return true;
    }),
    [filter, positions],
  );

  const stats = useMemo(
    () => positions.reduce(
      (acc, position) => ({
        costBasis: acc.costBasis + position.costBasis,
        payout: acc.payout + position.payout,
        pnl: acc.pnl + position.pnl,
        wins: acc.wins + (position.pnl > 0 ? 1 : 0),
        losses: acc.losses + (position.pnl < 0 ? 1 : 0),
      }),
      { costBasis: 0, payout: 0, pnl: 0, wins: 0, losses: 0 },
    ),
    [positions],
  );

  if (!username) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-10 text-center">
        <h1 className="text-2xl font-black text-[var(--color-card-text)]">Position history</h1>
        <Link href="/leaderboard" className="mx-auto rounded-lg border border-[var(--color-card-border)] px-4 py-2 text-xs font-bold text-[var(--color-card-text)]">
          Go to leaderboard
        </Link>
      </div>
    );
  }

  if (loading) {
    return <div className="mx-auto max-w-lg px-4 py-10 text-sm text-[var(--color-card-muted)]">Loading positions...</div>;
  }

  if (!profile) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-10 text-center">
        <h1 className="text-2xl font-black text-[var(--color-card-text)]">Profile not found</h1>
        <Link href="/leaderboard" className="mx-auto rounded-lg border border-[var(--color-card-border)] px-4 py-2 text-xs font-bold text-[var(--color-card-text)]">
          Back to leaderboard
        </Link>
      </div>
    );
  }

  const roi = stats.costBasis > 0 ? (stats.pnl / stats.costBasis) * 100 : 0;

  async function loadMore() {
    if (!profile || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await getPublicSettledPositionsPage(profile.uid, PAGE_SIZE, nextCursor);
      setPositions((current) => [...current, ...page.positions]);
      setNextCursor(page.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6">
      <header className="flex flex-col gap-3">
        <Link href={`/profile?u=${profile.username}`} className="text-xs font-bold text-[var(--color-brand-primary)]">
          Back to @{profile.username}
        </Link>
        <div>
          <h1 className="text-3xl font-black text-[var(--color-card-text)]">Position History</h1>
          <p className="mt-1 text-sm text-[var(--color-card-muted)]">@{profile.username} / {positions.length}{nextCursor ? "+" : ""} closed positions</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Net P/L", value: `${stats.pnl >= 0 ? "+" : ""}$${stats.pnl.toFixed(2)}`, good: stats.pnl >= 0 },
          { label: "ROI", value: `${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%`, good: roi >= 0 },
          { label: "Wins", value: String(stats.wins), neutral: true },
          { label: "Volume", value: `$${stats.costBasis.toFixed(2)}`, neutral: true },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-3">
            <p className={`text-lg font-black ${
              stat.neutral ? "text-[var(--color-card-text)]" : stat.good ? "text-[var(--color-card-yes)]" : "text-[var(--color-card-no)]"
            }`}>
              {stat.value}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--color-card-muted)]">{stat.label}</p>
          </div>
        ))}
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`h-9 shrink-0 rounded-lg border px-3 text-xs font-bold ${
              filter === item.id
                ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-dim)] text-[var(--color-brand-primary)]"
                : "border-[var(--color-card-border)] text-[var(--color-card-muted)]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 text-sm text-[var(--color-card-muted)]">
            No positions match this filter.
          </div>
        ) : (
          filtered.map((position) => <PositionRow key={position.id} position={position} />)
        )}
        {nextCursor && (
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="mt-2 h-11 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] text-sm font-bold text-[var(--color-card-text)] disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load more positions"}
          </button>
        )}
      </section>
    </div>
  );
}

function PositionRow({ position }: { position: SettledPositionRecord }) {
  const isProfit = position.pnl >= 0;
  const opened = new Date(position.openedAtMs).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const closed = new Date(position.closedAtMs).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <article className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--color-card-text)]">{position.marketTitle}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-card-muted)]">
            {position.sport} / {position.side.toUpperCase()} / {position.outcome === "sold" ? "Sold" : `${position.outcome.toUpperCase()} settled`}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-base font-black ${isProfit ? "text-[var(--color-card-yes)]" : "text-[var(--color-card-no)]"}`}>
            {isProfit ? "+" : ""}${position.pnl.toFixed(2)}
          </p>
          <p className="text-[10px] text-[var(--color-card-muted)]">{opened} to {closed}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Contracts", value: position.contracts.toFixed(1) },
          { label: "Cost", value: `$${position.costBasis.toFixed(2)}` },
          { label: "Paid", value: `$${position.payout.toFixed(2)}` },
        ].map((item) => (
          <div key={item.label} className="rounded-lg bg-[var(--color-card-bg)] px-2 py-2">
            <p className="text-xs font-black text-[var(--color-card-text)]">{item.value}</p>
            <p className="mt-1 text-[9px] uppercase tracking-wider text-[var(--color-card-muted)]">{item.label}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
