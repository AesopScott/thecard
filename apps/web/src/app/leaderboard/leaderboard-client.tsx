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
  subscribeToSeasonLeaderboard,
} from "@/lib/season-store";
import { SeasonBanner } from "@/components/season-banner";
import type { SeasonLeaderboardEntry } from "@thecard/types";

type Tab = "season" | "calibration";
type SeasonFilter = "all" | "verified" | "eligible" | "prize" | "needs-bets";

const MIN_PRIZE_BETS = 5;
const PAYOUT_SHARES = [0.4, 0.2, 0.1, 0.075, 0.06, 0.05, 0.04, 0.035, 0.025, 0.015];

function formatMoney(amount: number): string {
  return `$${Math.round(amount).toLocaleString()}`;
}

function projectedPayout(rank: number): number {
  return ACTIVE_SEASON.prizePoolEstimate * (PAYOUT_SHARES[rank - 1] ?? 0);
}

function pseudoRankDelta(entry: SeasonLeaderboardEntry): number {
  if (entry.isYou) return 0;
  const seed = Array.from(entry.displayName).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (seed % 7) - 3;
}

function seasonProgress(): number {
  const total = ACTIVE_SEASON.endDate.getTime() - ACTIVE_SEASON.startDate.getTime();
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, ((Date.now() - ACTIVE_SEASON.startDate.getTime()) / total) * 100));
}

function shareText(entry: SeasonLeaderboardEntry): string {
  return `I am ranked #${entry.rank} on The Card with ${formatMoney(entry.bankroll)} in Season ${getSeasonNumber(ACTIVE_SEASON)}.`;
}

function matchesSearch(entry: SeasonLeaderboardEntry, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return entry.displayName.toLowerCase().includes(normalized) || (entry.username ?? "").toLowerCase().includes(normalized);
}

function matchesFilter(entry: SeasonLeaderboardEntry, filter: SeasonFilter): boolean {
  if (filter === "verified") return !entry.isPreview;
  if (filter === "eligible") return entry.betCount >= MIN_PRIZE_BETS;
  if (filter === "prize") return entry.rank <= 10;
  if (filter === "needs-bets") return entry.betCount < MIN_PRIZE_BETS;
  return true;
}

// ── Season tab ──────────────────────────────────────────────────────────────

function SeasonTab() {
  const { user, verificationRequired } = useAuth();
  const [membership, setMembership] = useState(() => getMembership(GLOBAL_LEAGUE.id));
  const [board, setBoard] = useState<SeasonLeaderboardEntry[]>(() => {
    const membership = getMembership(GLOBAL_LEAGUE.id);
    return buildSeasonLeaderboard(membership.currentBankroll, membership.betCount);
  });
  const [isLive, setIsLive] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<SeasonFilter>("all");
  const [previewEntry, setPreviewEntry] = useState<SeasonLeaderboardEntry | null>(null);
  const status = getSeasonStatus(ACTIVE_SEASON);

  useEffect(() => {
    initGlobalLeague();
    const fallbackUser = user
      ? {
          uid: user.uid,
          displayName: user.displayName ?? user.email?.split("@")[0] ?? "You",
          photoURL: user.photoURL,
          avatarInitial: (user.displayName?.[0] ?? user.email?.[0] ?? "Y").toUpperCase(),
        }
      : undefined;

    function refresh() {
      const applyMembership = (m: ReturnType<typeof getMembership>) => {
        setMembership(m);
        setBoard((currentBoard) => (
          isLive && currentBoard.length > 0
            ? currentBoard
            : buildSeasonLeaderboard(m.currentBankroll, m.betCount, fallbackUser)
        ));
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
  }, [user, verificationRequired, isLive]);

  useEffect(() => {
    return subscribeToSeasonLeaderboard(GLOBAL_LEAGUE.id, (entries) => {
      if (entries.length === 0) {
        setIsLive(false);
        return;
      }
      setIsLive(entries.some((entry) => !entry.isPreview));
      setBoard(entries);
    }, user?.uid);
  }, [user?.uid]);

  const pnl = membership.currentBankroll - STARTING_BANKROLL;
  const pnlColor = pnl >= 0 ? "var(--color-card-yes)" : "var(--color-card-no)";
  const pnlSign = pnl >= 0 ? "+" : "-";
  const progress = seasonProgress();
  const podium = board.slice(0, 3);
  const filteredBoard = board.filter((entry) => matchesSearch(entry, search) && matchesFilter(entry, filter));
  const visibleBoard = filteredBoard.slice(0, 12);
  const youEntry = board.find((entry) => entry.isYou);
  const showStickyYou = Boolean(youEntry && !visibleBoard.some((entry) => entry.isYou));
  const biggestMovers = board
    .map((entry) => ({ entry, delta: pseudoRankDelta(entry) }))
    .filter(({ delta }) => delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-4">
      <SeasonBanner variant="full" />

      {status === "upcoming" && (
        <div className="rounded-xl border border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/10 px-4 py-5 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest">Season {getSeasonNumber(ACTIVE_SEASON)} preview</p>
              <p className="text-lg font-black text-[var(--color-card-text)]">Opening month leaderboard</p>
            </div>
            <Link href="/card" className="shrink-0 rounded-lg bg-[var(--color-brand-primary)] px-3 py-2 text-[10px] font-black text-white">
              Join free
            </Link>
          </div>
          <p className="text-xs text-[var(--color-card-muted)] leading-relaxed">
            Everyone starts with {formatMoney(STARTING_BANKROLL)} on{" "}
            {ACTIVE_SEASON.startDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}. Top 10 eligible players split the prize pool.
          </p>
          <div className="flex items-center justify-between rounded-lg border border-[var(--color-brand-primary)]/20 bg-[var(--color-card-surface)] px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-card-muted)]">Projected pool</span>
            <span className="text-sm font-black text-[var(--color-card-text)]">{formatMoney(ACTIVE_SEASON.prizePoolEstimate)}+</span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[10px] font-semibold text-[var(--color-card-muted)]">
              <span>Season clock</span>
              <span>0%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--color-card-bg)]">
              <div className="h-full rounded-full bg-[var(--color-brand-primary)]" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )}

      {status !== "upcoming" && (
        <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest">Season clock</span>
              <span className="text-xs text-[var(--color-card-muted)]">
                Closes {ACTIVE_SEASON.endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
            <span className="text-sm font-black text-[var(--color-card-text)]">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--color-card-bg)]">
            <div className="h-full rounded-full bg-[var(--color-brand-primary)]" style={{ width: `${progress}%` }} />
          </div>
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

      <div className="grid grid-cols-3 gap-2">
        {podium.map((entry) => (
          <PodiumCard key={`${entry.displayName}-podium`} entry={entry} />
        ))}
      </div>

      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest">Prize preview</span>
            <span className="text-xs text-[var(--color-card-muted)]">Projected top 10 split</span>
          </div>
          <span className="text-sm font-black text-[var(--color-card-text)]">{formatMoney(ACTIVE_SEASON.prizePoolEstimate)}</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {PAYOUT_SHARES.map((share, i) => (
            <div key={share} className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] px-2 py-2 text-center">
              <p className="text-[10px] font-bold text-[var(--color-card-muted)]">#{i + 1}</p>
              <p className="mt-0.5 text-[10px] font-black text-[var(--color-card-text)]">{formatMoney(ACTIVE_SEASON.prizePoolEstimate * share)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest">Biggest movers</span>
            <span className="text-xs text-[var(--color-card-muted)]">Since the last standings snapshot</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {biggestMovers.map(({ entry, delta }) => (
            <div key={`${entry.displayName}-mover`} className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3">
              <p className={`text-sm font-black ${delta > 0 ? "text-[var(--color-card-yes)]" : "text-[var(--color-card-no)]"}`}>
                {delta > 0 ? "+" : ""}{delta}
              </p>
              <p className="mt-1 truncate text-[10px] font-semibold text-[var(--color-card-text)]">{entry.displayName}</p>
              <p className="text-[9px] text-[var(--color-card-muted)]">rank {entry.rank}</p>
            </div>
          ))}
        </div>
      </div>

      {youEntry && (
        <ShareRankCard entry={youEntry} />
      )}

      {youEntry && youEntry.betCount < MIN_PRIZE_BETS && (
        <div className="rounded-xl border border-[var(--color-card-no)]/30 bg-[var(--color-card-no-dim)] p-4">
          <p className="text-sm font-black text-[var(--color-card-text)]">Prize eligibility pending</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-card-muted)]">
            Place {MIN_PRIZE_BETS - youEntry.betCount} more bets this season to qualify for the top 10 payout table.
          </p>
        </div>
      )}

      <TieBreakerCard />

      {/* Leaderboard table */}
      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] divide-y divide-[var(--color-card-border)]">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[10px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest">
              Global season standings
            </span>
            <span className="truncate text-[10px] text-[var(--color-card-muted)]">
              {isLive ? "Live from Firestore" : "Preview board until players join"}
            </span>
          </div>
          <span className="shrink-0 text-[10px] font-semibold text-[var(--color-card-muted)]">
            {board.length} rows
          </span>
        </div>
        <div className="px-4 py-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-card-muted)]">Search players</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search username"
              className="h-10 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] px-3 text-sm font-semibold text-[var(--color-card-text)] outline-none placeholder:text-[var(--color-card-muted)] focus:border-[var(--color-brand-primary)]"
            />
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {([
              ["all", "All"],
              ["verified", "Verified"],
              ["eligible", "Eligible"],
              ["prize", "Top 10"],
              ["needs-bets", "Needs bets"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`min-h-9 rounded-lg px-2 text-[10px] font-black transition-colors ${
                  filter === value
                    ? "bg-[var(--color-brand-primary)] text-white"
                    : "border border-[var(--color-card-border)] text-[var(--color-card-muted)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="px-4 py-3 grid grid-cols-[24px_1fr_80px_40px] gap-2 items-center">
          <span className="text-[10px] font-semibold text-[var(--color-card-muted)] uppercase tracking-wider">#</span>
          <span className="text-[10px] font-semibold text-[var(--color-card-muted)] uppercase tracking-wider">Player</span>
          <span className="text-[10px] font-semibold text-[var(--color-card-muted)] uppercase tracking-wider text-right">Bankroll</span>
          <span className="text-[10px] font-semibold text-[var(--color-card-muted)] uppercase tracking-wider text-right">Bets</span>
        </div>
        {visibleBoard.length > 0 ? (
          visibleBoard.map((entry) => (
            <SeasonRow key={`${entry.displayName}-${entry.rank}`} entry={entry} onPreview={setPreviewEntry} />
          ))
        ) : (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-black text-[var(--color-card-text)]">No matching players</p>
            <p className="mt-1 text-xs text-[var(--color-card-muted)]">Try a different search or filter.</p>
          </div>
        )}
        {showStickyYou && youEntry && (
          <div className="sticky bottom-16 z-10 border-t border-[var(--color-brand-primary)]/30 bg-[var(--color-card-surface)] shadow-[0_-12px_30px_rgba(0,0,0,0.35)]">
            <SeasonRow entry={youEntry} onPreview={setPreviewEntry} />
          </div>
        )}
      </div>

      {previewEntry && (
        <ProfilePreviewDrawer entry={previewEntry} onClose={() => setPreviewEntry(null)} />
      )}

      {membership.isBust && (
        <div className="rounded-xl border border-[var(--color-card-no)]/30 bg-[var(--color-card-no-dim)] p-4 text-center">
          <p className="text-sm font-bold text-[var(--color-card-no)]">Bust — bankroll reached $0</p>
          <p className="text-xs text-[var(--color-card-muted)] mt-1">Season {getSeasonNumber(ACTIVE_SEASON)} resets {ACTIVE_SEASON.endDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}</p>
        </div>
      )}
    </div>
  );
}

function PodiumCard({ entry }: { entry: SeasonLeaderboardEntry }) {
  const payout = projectedPayout(entry.rank);
  const delta = pseudoRankDelta(entry);
  const isFirst = entry.rank === 1;
  const isPreview = Boolean(entry.isPreview);

  return (
    <Link
      href={!isPreview && entry.username ? `/profile?u=${encodeURIComponent(entry.username)}` : "/leaderboard"}
      className={`rounded-xl border p-3 text-center transition-colors hover:bg-[var(--color-surface-2)] ${
        isFirst
          ? "border-[var(--color-brand-primary)]/50 bg-[var(--color-brand-primary)]/10"
          : "border-[var(--color-card-border)] bg-[var(--color-card-surface)]"
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">#{entry.rank}</p>
      <div className="mx-auto mt-2 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[var(--color-card-accent)] text-sm font-black text-white">
        {entry.photoURL
          ? <Image src={entry.photoURL} alt="" width={40} height={40} className="h-full w-full object-cover" unoptimized />
          : entry.avatarInitial}
      </div>
      <p className="mt-2 truncate text-xs font-black text-[var(--color-card-text)]">{entry.displayName}</p>
      <p className="text-[10px] font-semibold text-[var(--color-card-muted)]">{formatMoney(entry.bankroll)}</p>
      <div className="mt-2 flex items-center justify-center gap-1 text-[9px] font-bold">
        <span className={delta >= 0 ? "text-[var(--color-card-yes)]" : "text-[var(--color-card-no)]"}>
          {delta === 0 ? "new" : `${delta > 0 ? "+" : ""}${delta}`}
        </span>
        {payout > 0 && <span className="text-[var(--color-card-muted)]">/ {formatMoney(payout)}</span>}
      </div>
    </Link>
  );
}

function ShareRankCard({ entry }: { entry: SeasonLeaderboardEntry }) {
  const [copied, setCopied] = useState(false);

  async function copyShareText() {
    const text = `${shareText(entry)} https://thecard.bet/leaderboard`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--color-brand-primary)]/30 bg-[var(--color-card-surface)] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest">Shareable rank card</span>
          <span className="text-xs text-[var(--color-card-muted)]">A quick post for your current standing</span>
        </div>
        <button
          type="button"
          onClick={copyShareText}
          className="rounded-lg border border-[var(--color-card-border)] px-3 py-2 text-[10px] font-black text-[var(--color-card-text)] hover:bg-[var(--color-surface-2)]"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="rounded-lg bg-[var(--color-card-bg)] p-3">
        <p className="text-lg font-black text-[var(--color-card-text)]">#{entry.rank} on The Card</p>
        <p className="mt-1 text-sm text-[var(--color-card-muted)]">{formatMoney(entry.bankroll)} bankroll / {entry.betCount} bets</p>
      </div>
    </div>
  );
}

function TieBreakerCard() {
  return (
    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Tie-breakers</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          ["1", "Bankroll", "Highest balance wins"],
          ["2", "Bets", "More action breaks ties"],
          ["3", "Joined", "Earlier account wins"],
        ].map(([step, label, detail]) => (
          <div key={step} className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3">
            <p className="text-[10px] font-black text-[var(--color-brand-primary)]">#{step}</p>
            <p className="mt-1 text-xs font-black text-[var(--color-card-text)]">{label}</p>
            <p className="mt-1 text-[9px] leading-snug text-[var(--color-card-muted)]">{detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EligibilityBadges({ entry }: { entry: SeasonLeaderboardEntry }) {
  const eligible = entry.betCount >= MIN_PRIZE_BETS;
  const badges = [
    entry.isPreview ? "Preview" : null,
    entry.rank <= 10 ? "Prize zone" : "Chasing",
    eligible ? "Eligible" : `${MIN_PRIZE_BETS - entry.betCount} bets left`,
    entry.isYou ? "You" : entry.rank <= 3 ? "Podium" : null,
  ].filter(Boolean);

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {badges.map((badge) => (
        <span
          key={badge}
          className={`rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide ${
            badge === "Eligible" || badge === "Prize zone" || badge === "Podium"
              ? "bg-[var(--color-card-yes-dim)] text-[var(--color-card-yes)]"
              : badge === "You" || badge === "Preview"
                ? "bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)]"
                : "bg-[var(--color-card-no-dim)] text-[var(--color-card-no)]"
          }`}
        >
          {badge}
        </span>
      ))}
    </div>
  );
}

function SeasonRow({
  entry,
  onPreview,
}: {
  entry: SeasonLeaderboardEntry;
  onPreview: (entry: SeasonLeaderboardEntry) => void;
}) {
  const pnl = entry.bankroll - STARTING_BANKROLL;
  const pnlColor = pnl >= 0 ? "var(--color-card-yes)" : "var(--color-card-no)";
  const pnlSign = pnl >= 0 ? "+" : "-";
  const delta = pseudoRankDelta(entry);
  const payout = projectedPayout(entry.rank);
  const eligible = entry.betCount >= MIN_PRIZE_BETS;
  const highlight = entry.isYou
    ? "bg-[var(--color-brand-primary)]/5"
    : "";

  const content = (
    <>
      <span className="text-xs font-bold text-[var(--color-card-muted)] text-right">{entry.rank}</span>
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 rounded-full bg-[var(--color-card-accent)] flex items-center justify-center overflow-hidden text-white text-[9px] font-black shrink-0">
          {entry.photoURL
            ? <Image src={entry.photoURL} alt="" width={24} height={24} className="h-full w-full object-cover" unoptimized />
            : entry.avatarInitial}
        </div>
        <div className="flex min-w-0 flex-col">
          <span className={`text-xs font-semibold truncate ${entry.isYou ? "text-[var(--color-brand-primary)]" : "text-[var(--color-card-text)]"}`}>
            {entry.displayName}
            {entry.isYou && <span className="ml-1 text-[9px] opacity-60">(you)</span>}
          </span>
          <span className="truncate text-[9px] text-[var(--color-card-muted)]">
            {entry.isPreview ? "Preview row" : entry.username ? `@${entry.username}` : "unclaimed"} / {eligible ? "eligible" : `${MIN_PRIZE_BETS - entry.betCount} bets to qualify`}
          </span>
          <EligibilityBadges entry={entry} />
        </div>
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
        {payout > 0 && eligible && (
          <span className="text-[9px] text-[var(--color-card-muted)]">{formatMoney(payout)} est.</span>
        )}
      </div>
      <div className="flex flex-col items-end">
        <span className="text-xs text-[var(--color-card-muted)] text-right">{entry.betCount}</span>
        <span className={`text-[9px] font-bold ${delta >= 0 ? "text-[var(--color-card-yes)]" : "text-[var(--color-card-no)]"}`}>
          {delta === 0 ? "new" : `${delta > 0 ? "+" : ""}${delta}`}
        </span>
      </div>
    </>
  );

  const rowClass = `w-full px-4 py-3 grid grid-cols-[24px_1fr_80px_40px] gap-2 items-center text-left ${highlight}`;

  return (
    <button type="button" onClick={() => onPreview(entry)} className={`${rowClass} hover:bg-[var(--color-surface-2)] transition-colors`}>
      {content}
    </button>
  );
}

function ProfilePreviewDrawer({
  entry,
  onClose,
}: {
  entry: SeasonLeaderboardEntry;
  onClose: () => void;
}) {
  const pnl = entry.bankroll - STARTING_BANKROLL;
  const eligible = entry.betCount >= MIN_PRIZE_BETS;
  const payout = projectedPayout(entry.rank);
  const isPreview = Boolean(entry.isPreview);

  return (
    <div className="fixed inset-0 z-[100] flex items-end bg-black/60 px-4 pb-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close profile preview" />
      <div className="relative mx-auto w-full max-w-lg rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-card-accent)] text-base font-black text-white">
              {entry.photoURL
                ? <Image src={entry.photoURL} alt="" width={48} height={48} className="h-full w-full object-cover" unoptimized />
                : entry.avatarInitial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-black text-[var(--color-card-text)]">{entry.displayName}</p>
              <p className="text-xs text-[var(--color-card-muted)]">{isPreview ? "Preview row" : entry.username ? `@${entry.username}` : "Profile unclaimed"}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-[var(--color-card-border)] px-3 py-2 text-[10px] font-black text-[var(--color-card-text)]">
            Close
          </button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            ["Rank", `#${entry.rank}`],
            ["Bankroll", formatMoney(entry.bankroll)],
            ["P/L", `${pnl >= 0 ? "+" : "-"}${formatMoney(Math.abs(pnl))}`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3 text-center">
              <p className="text-base font-black text-[var(--color-card-text)]">{value}</p>
              <p className="mt-1 text-[9px] uppercase tracking-wider text-[var(--color-card-muted)]">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3">
          <p className="text-xs font-black text-[var(--color-card-text)]">
            {eligible ? "Prize eligible" : `${MIN_PRIZE_BETS - entry.betCount} more bets to become prize eligible`}
          </p>
          <p className="mt-1 text-xs text-[var(--color-card-muted)]">
            {payout > 0 && eligible ? `${formatMoney(payout)} projected payout at current rank.` : "Top 10 eligible players split the season pool."}
          </p>
        </div>
        <div className="mt-4 flex gap-2">
          {!isPreview && entry.username && (
            <Link href={`/profile?u=${encodeURIComponent(entry.username)}`} className="flex-1 rounded-lg bg-[var(--color-brand-primary)] px-4 py-3 text-center text-xs font-black text-white">
              Open profile
            </Link>
          )}
          <button type="button" onClick={() => navigator.clipboard?.writeText(`${shareText(entry)} https://thecard.bet/leaderboard`)} className="flex-1 rounded-lg border border-[var(--color-card-border)] px-4 py-3 text-xs font-black text-[var(--color-card-text)]">
            Copy rank
          </button>
        </div>
      </div>
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
    <Link href={`/profile?u=${encodeURIComponent(entry.username)}`} className="px-4 py-3 flex items-center gap-3 hover:bg-[var(--color-surface-2)] transition-colors">
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
