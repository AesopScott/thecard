"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
import { subscribeToLeaderboard, type LeaderboardEntry } from "@/lib/user-store";
import {
  ACTIVE_SEASON,
  GLOBAL_LEAGUE,
  MIN_PRIZE_BETS,
  SEASON_PAYOUT_LABELS,
  SEASON_BANKROLL_EVENT,
  STARTING_BANKROLL,
  buildSeasonLeaderboard,
  getSeasonRolloverCopy,
  getSeasonTimeline,
  getMembership,
  getSeasonNumber,
  getSeasonStatus,
  getUserSeasonMembership,
  initGlobalLeague,
  subscribeToSeasonLeaderboard,
} from "@/lib/season-store";
import { SeasonBanner } from "@/components/season-banner";
import { ScoutMascot } from "@/components/scout-mascot";
import type { SeasonLeaderboardEntry } from "@thecard/types";

type Tab = "season" | "calibration";
type SeasonFilter = "all" | "verified" | "eligible" | "prize" | "needs-bets";
type TimeScope = "daily" | "weekly" | "season";
type ModeScope = "overall" | "card" | "blitz" | "live" | "h2h" | "forecast";
type SportScope = "all" | "nfl" | "nba" | "mlb" | "nhl" | "ufc" | "soccer";

function formatMoney(amount: number): string {
  return `$${Math.round(amount).toLocaleString()}`;
}

function projectedPayout(rank: number): number {
  return ACTIVE_SEASON.prizePoolEstimate * (ACTIVE_SEASON.payoutShares[rank - 1] ?? 0);
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

function pseudoSport(entry: SeasonLeaderboardEntry): SportScope {
  const sports: SportScope[] = ["nfl", "nba", "mlb", "nhl", "ufc", "soccer"];
  const seed = Array.from(entry.displayName).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return sports[seed % sports.length]!;
}

function pseudoModeScore(entry: SeasonLeaderboardEntry, mode: ModeScope): number {
  if (mode === "overall") return entry.bankroll;
  const seed = Array.from(`${entry.displayName}-${mode}`).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return entry.bankroll + ((seed % 15) - 7) * 85;
}

function pseudoTimeScore(entry: SeasonLeaderboardEntry, scope: TimeScope): number {
  if (scope === "season") return entry.bankroll;
  const seed = Array.from(`${entry.displayName}-${scope}`).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const swing = scope === "daily" ? 420 : 260;
  return entry.bankroll + ((seed % 9) - 4) * swing;
}

function buildScopedBoard(board: SeasonLeaderboardEntry[], timeScope: TimeScope, modeScope: ModeScope, sportScope: SportScope): SeasonLeaderboardEntry[] {
  const scoped = sportScope === "all" ? board : board.filter((entry) => entry.isYou || pseudoSport(entry) === sportScope);
  return scoped
    .map((entry) => ({
      ...entry,
      bankroll: Math.max(0, Math.round((pseudoModeScore(entry, modeScope) + pseudoTimeScore(entry, timeScope)) / 2)),
    }))
    .sort((a, b) => b.bankroll - a.bankroll)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

// ── Season tab ──────────────────────────────────────────────────────────────

function SeasonTab() {
  const { user, verificationRequired } = useAuth();
  const { t } = useI18n();
  const [membership, setMembership] = useState(() => getMembership(GLOBAL_LEAGUE.id));
  const [board, setBoard] = useState<SeasonLeaderboardEntry[]>(() => {
    const membership = getMembership(GLOBAL_LEAGUE.id);
    return buildSeasonLeaderboard(membership.currentBankroll, membership.betCount);
  });
  const [isLive, setIsLive] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<SeasonFilter>("all");
  const [timeScope, setTimeScope] = useState<TimeScope>("season");
  const [modeScope, setModeScope] = useState<ModeScope>("overall");
  const [sportScope, setSportScope] = useState<SportScope>("all");
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

  const aggregatePnl = membership.currentBankroll - STARTING_BANKROLL;
  const aggregateColor = aggregatePnl >= 0 ? "var(--color-card-yes)" : "var(--color-card-no)";
  const aggregateSign = aggregatePnl >= 0 ? "+" : "-";
  const progress = seasonProgress();
  const scopedBoard = buildScopedBoard(board, timeScope, modeScope, sportScope);
  const podium = scopedBoard.slice(0, 3);
  const filteredBoard = scopedBoard.filter((entry) => matchesSearch(entry, search) && matchesFilter(entry, filter));
  const visibleBoard = filteredBoard.slice(0, 12);
  const youEntry = scopedBoard.find((entry) => entry.isYou);
  const showStickyYou = Boolean(youEntry && !visibleBoard.some((entry) => entry.isYou));
  const biggestMovers = scopedBoard
    .map((entry) => ({ entry, delta: pseudoRankDelta(entry) }))
    .filter(({ delta }) => delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);
  const prizeCutEntry = scopedBoard.find((entry) => entry.rank === 10);
  const rivalEntry = youEntry ? scopedBoard.find((entry) => entry.rank === Math.max(1, youEntry.rank - 1)) : null;

  return (
    <div className="flex flex-col gap-4">
      <SeasonBanner variant="full" />

      {status === "upcoming" && (
        <div className="rounded-xl border border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/10 px-4 py-5 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest">{t("leaderboard.seasonPreview").replace("{season}", String(getSeasonNumber(ACTIVE_SEASON)))}</p>
              <p className="text-lg font-black text-[var(--color-card-text)]">{t("leaderboard.openingMonth")}</p>
            </div>
            <Link href="/card" className="shrink-0 rounded-lg bg-[var(--color-brand-primary)] px-3 py-2 text-[10px] font-black text-white">
              {t("leaderboard.joinFree")}
            </Link>
          </div>
          <p className="text-xs text-[var(--color-card-muted)] leading-relaxed">
            Everyone starts with {formatMoney(STARTING_BANKROLL)} on{" "}
            {ACTIVE_SEASON.startDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}. Top 10 eligible players split the prize pool.
          </p>
          <div className="flex items-center justify-between rounded-lg border border-[var(--color-brand-primary)]/20 bg-[var(--color-card-surface)] px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-card-muted)]">{t("leaderboard.projectedPool")}</span>
            <span className="text-sm font-black text-[var(--color-card-text)]">{formatMoney(ACTIVE_SEASON.prizePoolEstimate)}+</span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[10px] font-semibold text-[var(--color-card-muted)]">
              <span>{t("leaderboard.seasonClock")}</span>
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
              <span className="text-[10px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest">{t("leaderboard.seasonClock")}</span>
              <span className="text-xs text-[var(--color-card-muted)]">
                {t("leaderboard.closesDate", { date: ACTIVE_SEASON.endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) })}
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
          <span className="text-[10px] text-[var(--color-card-muted)] uppercase tracking-wider">{t("leaderboard.aggregatePl")}</span>
          <span className="text-base font-black" style={{ color: aggregateColor }}>
            {aggregateSign}${Math.abs(aggregatePnl).toLocaleString()}
          </span>
          <span className="text-[10px] text-[var(--color-card-muted)]">{t("leaderboard.noGlobalBankroll")}</span>
        </div>
        <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-3 flex flex-col gap-0.5">
          <span className="text-[10px] text-[var(--color-card-muted)] uppercase tracking-wider">{t("leaderboard.bets")}</span>
          <span className="text-base font-black text-[var(--color-card-text)]">{membership.betCount}</span>
        </div>
        <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-3 flex flex-col gap-0.5">
          <span className="text-[10px] text-[var(--color-card-muted)] uppercase tracking-wider">{t("leaderboard.league")}</span>
          <span className="text-base font-black text-[var(--color-card-text)]">{t("leaderboard.global")}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {podium.map((entry) => (
          <PodiumCard key={`${entry.displayName}-podium`} entry={entry} />
        ))}
      </div>

      <LeaderboardScopeControls
        timeScope={timeScope}
        modeScope={modeScope}
        sportScope={sportScope}
        onTimeScope={setTimeScope}
        onModeScope={setModeScope}
        onSportScope={setSportScope}
      />

      <LeaderboardStoryMode
        board={scopedBoard}
        biggestMovers={biggestMovers}
        youEntry={youEntry ?? null}
        rivalEntry={rivalEntry ?? null}
        prizeCutEntry={prizeCutEntry ?? null}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {youEntry && <RivalCalloutCard youEntry={youEntry} rivalEntry={rivalEntry ?? null} />}
        <PrizeCutLineCard prizeCutEntry={prizeCutEntry ?? null} youEntry={youEntry ?? null} />
      </div>

      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest">{t("leaderboard.prizePreview")}</span>
            <span className="text-xs text-[var(--color-card-muted)]">{t("leaderboard.prizeSplit").replace("{bets}", String(MIN_PRIZE_BETS))}</span>
          </div>
          <span className="text-sm font-black text-[var(--color-card-text)]">{formatMoney(ACTIVE_SEASON.prizePoolEstimate)}</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {SEASON_PAYOUT_LABELS.map(({ rank, share }) => (
            <div key={rank} className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] px-2 py-2 text-center">
              <p className="text-[10px] font-bold text-[var(--color-card-muted)]">#{rank}</p>
              <p className="mt-0.5 text-[10px] font-black text-[var(--color-card-text)]">{formatMoney(ACTIVE_SEASON.prizePoolEstimate * share)}</p>
            </div>
          ))}
        </div>
      </div>

      <SeasonMechanicsCard />
      <SeasonArchiveCard />

      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest">{t("leaderboard.biggestMovers")}</span>
            <span className="text-xs text-[var(--color-card-muted)]">{t("leaderboard.moversBody")}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {biggestMovers.map(({ entry, delta }) => (
            <div key={`${entry.displayName}-mover`} className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3">
              <p className={`text-sm font-black ${delta > 0 ? "text-[var(--color-card-yes)]" : "text-[var(--color-card-no)]"}`}>
                {delta > 0 ? "+" : ""}{delta}
              </p>
              <p className="mt-1 truncate text-[10px] font-semibold text-[var(--color-card-text)]">{entry.displayName}</p>
              <p className="text-[9px] text-[var(--color-card-muted)]">{t("leaderboard.rank")} {entry.rank}</p>
            </div>
          ))}
        </div>
      </div>

      {youEntry && (
        <ShareRankCard entry={youEntry} />
      )}

      {youEntry && youEntry.betCount < MIN_PRIZE_BETS && (
        <div className="rounded-xl border border-[var(--color-card-no)]/30 bg-[var(--color-card-no-dim)] p-4">
          <p className="text-sm font-black text-[var(--color-card-text)]">{t("leaderboard.prizePending")}</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-card-muted)]">
            {t("leaderboard.moreBetsNeeded", { count: String(MIN_PRIZE_BETS - youEntry.betCount) })}
          </p>
        </div>
      )}

      <TieBreakerCard />

      {/* Leaderboard table */}
      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] divide-y divide-[var(--color-card-border)]">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[10px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest">
              {t("leaderboard.globalStandings")}
            </span>
            <span className="truncate text-[10px] text-[var(--color-card-muted)]">
              {isLive ? t("leaderboard.liveFirestore") : t("leaderboard.previewBoard")}
            </span>
          </div>
          <span className="shrink-0 text-[10px] font-semibold text-[var(--color-card-muted)]">
            {board.length} {t("leaderboard.rows")}
          </span>
        </div>
        <div className="px-4 py-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-card-muted)]">{t("leaderboard.searchPlayers")}</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("leaderboard.searchPlaceholder")}
              className="h-10 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] px-3 text-sm font-semibold text-[var(--color-card-text)] outline-none placeholder:text-[var(--color-card-muted)] focus:border-[var(--color-brand-primary)]"
            />
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {([
              ["all", t("leaderboard.all")],
              ["verified", t("leaderboard.verified")],
              ["eligible", t("leaderboard.eligible")],
              ["prize", t("leaderboard.top10")],
              ["needs-bets", t("leaderboard.needsBets")],
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
          <span className="text-[10px] font-semibold text-[var(--color-card-muted)] uppercase tracking-wider">{t("leaderboard.player")}</span>
          <span className="text-[10px] font-semibold text-[var(--color-card-muted)] uppercase tracking-wider text-right">{t("leaderboard.bankroll")}</span>
          <span className="text-[10px] font-semibold text-[var(--color-card-muted)] uppercase tracking-wider text-right">{t("leaderboard.bets")}</span>
        </div>
        {visibleBoard.length > 0 ? (
          visibleBoard.map((entry) => (
            <SeasonRow key={`${entry.displayName}-${entry.rank}`} entry={entry} onPreview={setPreviewEntry} />
          ))
        ) : (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-black text-[var(--color-card-text)]">{t("leaderboard.noMatching")}</p>
            <p className="mt-1 text-xs text-[var(--color-card-muted)]">{t("leaderboard.noMatchingBody")}</p>
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
          <p className="text-sm font-bold text-[var(--color-card-no)]">{t("leaderboard.bustBankroll")}</p>
          <p className="text-xs text-[var(--color-card-muted)] mt-1">{t("leaderboard.seasonResets", { season: String(getSeasonNumber(ACTIVE_SEASON)), date: ACTIVE_SEASON.endDate.toLocaleDateString("en-US", { month: "long", day: "numeric" }) })}</p>
        </div>
      )}
    </div>
  );
}

function SeasonMechanicsCard() {
  const { t } = useI18n();
  return (
    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("leaderboard.seasonMechanics")}</p>
          <p className="mt-1 text-sm font-black text-[var(--color-card-text)]">{t("leaderboard.mechanicsBody")}</p>
        </div>
        <span className="shrink-0 rounded-lg border border-[var(--color-card-border)] px-2 py-1 text-[10px] font-black text-[var(--color-card-muted)]">
          {ACTIVE_SEASON.id}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          [t("leaderboard.reset"), `$${STARTING_BANKROLL.toLocaleString()}`, t("leaderboard.resetBody")],
          [t("leaderboard.eligibleShort"), `${MIN_PRIZE_BETS}+ ${t("leaderboard.bets").toLowerCase()}`, t("leaderboard.eligibleBody")],
          [t("leaderboard.rollover"), t("leaderboard.archived"), getSeasonRolloverCopy(ACTIVE_SEASON)],
        ].map(([label, value, detail]) => (
          <div key={label} className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-card-muted)]">{label}</p>
            <p className="mt-1 text-sm font-black text-[var(--color-card-text)]">{value}</p>
            <p className="mt-1 text-[9px] leading-snug text-[var(--color-card-muted)]">{detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeasonArchiveCard() {
  const { t } = useI18n();
  const seasons = getSeasonTimeline();

  return (
    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("leaderboard.seasonArchive")}</p>
          <p className="mt-1 text-xs text-[var(--color-card-muted)]">{t("leaderboard.archiveBody")}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {seasons.map((season) => {
          const status = getSeasonStatus(season);
          const active = season.id === ACTIVE_SEASON.id;
          return (
            <div
              key={season.id}
              className={`rounded-lg border px-2 py-2 text-center ${
                active
                  ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10"
                  : "border-[var(--color-card-border)] bg-[var(--color-card-bg)]"
              }`}
            >
              <p className="text-[10px] font-black text-[var(--color-card-text)]">S{getSeasonNumber(season)}</p>
              <p className="mt-0.5 truncate text-[9px] text-[var(--color-card-muted)]">{season.name.split(" ")[0]}</p>
              <p className={`mt-1 text-[8px] font-black uppercase ${
                status === "active" ? "text-[var(--color-card-yes)]" : status === "closed" ? "text-[var(--color-card-muted)]" : "text-[var(--color-brand-primary)]"
              }`}>
                {active ? t("leaderboard.current") : status === "active" ? t("leagues.active") : status === "closed" ? t("leagues.closed") : t("leagues.upcoming")}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PodiumCard({ entry }: { entry: SeasonLeaderboardEntry }) {
  const { t } = useI18n();
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
          {delta === 0 ? t("leaderboard.new") : `${delta > 0 ? "+" : ""}${delta}`}
        </span>
        {payout > 0 && <span className="text-[var(--color-card-muted)]">/ {formatMoney(payout)}</span>}
      </div>
    </Link>
  );
}

function LeaderboardScopeControls({
  timeScope,
  modeScope,
  sportScope,
  onTimeScope,
  onModeScope,
  onSportScope,
}: {
  timeScope: TimeScope;
  modeScope: ModeScope;
  sportScope: SportScope;
  onTimeScope: (scope: TimeScope) => void;
  onModeScope: (scope: ModeScope) => void;
  onSportScope: (scope: SportScope) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("leaderboard.boardControls")}</p>
          <p className="mt-1 text-xs text-[var(--color-card-muted)]">{t("leaderboard.boardControlsBody")}</p>
        </div>
        <ScoutMascot sheet="actions" action="trophy" motion="hype" className="h-16 w-16 shrink-0 opacity-90" />
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <ScopeButtonRow
          label={t("leaderboard.time")}
          items={[
            ["daily", t("leaderboard.daily")],
            ["weekly", t("leaderboard.weekly")],
            ["season", t("leaderboard.seasonTab")],
          ] as const}
          value={timeScope}
          onChange={onTimeScope}
        />
        <ScopeButtonRow
          label={t("leaderboard.mode")}
          items={[
            ["overall", t("leaderboard.overall")],
            ["card", "Card"],
            ["blitz", "Blitz"],
            ["live", "Live"],
            ["h2h", "H2H"],
            ["forecast", "Forecast"],
          ] as const}
          value={modeScope}
          onChange={onModeScope}
        />
        <ScopeButtonRow
          label={t("leaderboard.sport")}
          items={[
            ["all", t("leaderboard.all")],
            ["nfl", "NFL"],
            ["nba", "NBA"],
            ["mlb", "MLB"],
            ["nhl", "NHL"],
            ["ufc", "UFC"],
            ["soccer", "Soccer"],
          ] as const}
          value={sportScope}
          onChange={onSportScope}
        />
      </div>
    </div>
  );
}

function ScopeButtonRow<T extends string>({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: readonly (readonly [T, string])[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-card-muted)]">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map(([item, itemLabel]) => (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={`rounded-lg px-2.5 py-2 text-[10px] font-black transition-colors ${
              value === item
                ? "bg-[var(--color-brand-primary)] text-white"
                : "border border-[var(--color-card-border)] text-[var(--color-card-muted)]"
            }`}
          >
            {itemLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

function LeaderboardStoryMode({
  board,
  biggestMovers,
  youEntry,
  rivalEntry,
  prizeCutEntry,
}: {
  board: SeasonLeaderboardEntry[];
  biggestMovers: Array<{ entry: SeasonLeaderboardEntry; delta: number }>;
  youEntry: SeasonLeaderboardEntry | null;
  rivalEntry: SeasonLeaderboardEntry | null;
  prizeCutEntry: SeasonLeaderboardEntry | null;
}) {
  const { t } = useI18n();
  const leader = board[0] ?? null;
  const mover = biggestMovers[0] ?? null;
  const gapToRival = youEntry && rivalEntry ? rivalEntry.bankroll - youEntry.bankroll : null;
  const gapToCut = youEntry && prizeCutEntry ? prizeCutEntry.bankroll - youEntry.bankroll : null;

  return (
    <div className="rounded-xl border border-[var(--color-brand-primary)]/30 bg-[var(--color-card-surface)] p-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_86px] sm:items-center">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("leaderboard.story")}</p>
          <h2 className="mt-1 text-xl font-black text-[var(--color-card-text)]">
            {leader ? t("leaderboard.storyLeader", { name: leader.displayName }) : t("leaderboard.storyWaiting")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-card-muted)]">
            {mover
              ? t("leaderboard.storyMover", { name: mover.entry.displayName, delta: `${mover.delta > 0 ? "+" : ""}${mover.delta}` })
              : t("leaderboard.noMajorMovement")}{" "}
            {gapToRival !== null && gapToRival > 0
              ? t("leaderboard.behindRival", { amount: formatMoney(gapToRival), name: rivalEntry?.displayName ?? "" })
              : youEntry
                ? t("leaderboard.defendingSpot")
                : t("leaderboard.signInChase")}
          </p>
        </div>
        <ScoutMascot sheet="actions" action={mover && mover.delta > 0 ? "celebrate" : "trophy"} motion={mover ? "hype" : "idle"} className="mx-auto h-24 w-24" />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <StoryStat label={t("leaderboard.leader")} value={leader ? leader.displayName : "-"} detail={leader ? formatMoney(leader.bankroll) : t("leaderboard.noRows")} />
        <StoryStat label={t("leaderboard.prizeCut")} value={prizeCutEntry ? `#${prizeCutEntry.rank}` : "-"} detail={prizeCutEntry ? `${prizeCutEntry.displayName} / ${formatMoney(prizeCutEntry.bankroll)}` : t("leaderboard.top10Pending")} />
        <StoryStat label={t("leaderboard.yourChase")} value={youEntry ? `#${youEntry.rank}` : t("account.signIn")} detail={gapToCut !== null ? `${gapToCut <= 0 ? t("leaderboard.inside") : formatMoney(gapToCut)} ${t("leaderboard.prizeCut").toLowerCase()}` : t("leaderboard.personalizedRank")} />
      </div>
    </div>
  );
}

function StoryStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3">
      <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-card-muted)]">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-[var(--color-card-text)]">{value}</p>
      <p className="mt-1 truncate text-[10px] text-[var(--color-card-muted)]">{detail}</p>
    </div>
  );
}

function RivalCalloutCard({ youEntry, rivalEntry }: { youEntry: SeasonLeaderboardEntry; rivalEntry: SeasonLeaderboardEntry | null }) {
  const { t } = useI18n();
  if (!rivalEntry) {
    return (
      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("leaderboard.rivalCallout")}</p>
        <p className="mt-2 text-sm font-black text-[var(--color-card-text)]">{t("leaderboard.settingPace")}</p>
        <p className="mt-1 text-xs text-[var(--color-card-muted)]">{t("leaderboard.noOneAbove")}</p>
      </div>
    );
  }

  const gap = Math.max(0, rivalEntry.bankroll - youEntry.bankroll);
  return (
    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
      <div className="flex items-center gap-3">
        <ScoutMascot sheet="actions" action="fight" motion="sweat" className="h-16 w-16 shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("leaderboard.rivalCallout")}</p>
          <p className="mt-1 text-sm font-black text-[var(--color-card-text)]">{t("leaderboard.catchRival", { name: rivalEntry.displayName })}</p>
          <p className="mt-1 text-xs text-[var(--color-card-muted)]">{gap === 0 ? t("leaderboard.tiedBankroll") : t("leaderboard.gapToRival", { amount: formatMoney(gap), rank: String(rivalEntry.rank) })}</p>
        </div>
      </div>
    </div>
  );
}

function PrizeCutLineCard({ prizeCutEntry, youEntry }: { prizeCutEntry: SeasonLeaderboardEntry | null; youEntry: SeasonLeaderboardEntry | null }) {
  const { t } = useI18n();
  const insideCut = Boolean(youEntry && youEntry.rank <= 10);
  return (
    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
      <div className="flex items-center gap-3">
        <ScoutMascot sheet="actions" action={insideCut ? "celebrate" : "trophy"} motion={insideCut ? "hype" : "idle"} className="h-16 w-16 shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("leaderboard.prizeCutLine")}</p>
          <p className="mt-1 text-sm font-black text-[var(--color-card-text)]">
            {prizeCutEntry ? t("leaderboard.numberTenIs", { name: prizeCutEntry.displayName }) : t("leaderboard.top10Forming")}
          </p>
          <p className="mt-1 text-xs text-[var(--color-card-muted)]">
            {insideCut
              ? t("leaderboard.insidePrizeZone")
              : prizeCutEntry
                ? t("leaderboard.currentCut", { amount: formatMoney(prizeCutEntry.bankroll) })
                : t("leaderboard.eligibleDefineLine")}
          </p>
        </div>
      </div>
    </div>
  );
}

function ShareRankCard({ entry }: { entry: SeasonLeaderboardEntry }) {
  const [copied, setCopied] = useState(false);
  const { t } = useI18n();

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
          <span className="text-[10px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest">{t("leaderboard.shareRank")}</span>
          <span className="text-xs text-[var(--color-card-muted)]">{t("leaderboard.shareBody")}</span>
        </div>
        <button
          type="button"
          onClick={copyShareText}
          className="rounded-lg border border-[var(--color-card-border)] px-3 py-2 text-[10px] font-black text-[var(--color-card-text)] hover:bg-[var(--color-surface-2)]"
        >
          {copied ? t("leaderboard.copied") : t("leaderboard.copy")}
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
  const { t } = useI18n();
  return (
    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("leaderboard.tieBreakers")}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          ["1", t("leaderboard.bankroll"), t("leaderboard.highestBalanceWins")],
          ["2", t("leaderboard.bets"), t("leaderboard.moreActionBreaks")],
          ["3", t("leaderboard.joined"), t("leaderboard.earlierAccountWins")],
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
  const { t } = useI18n();
  const eligible = entry.betCount >= MIN_PRIZE_BETS;
  const badges = [
    entry.isPreview ? t("card.preview") : null,
    entry.rank <= 10 ? t("leaderboard.prizeZone") : t("leaderboard.chasing"),
    eligible ? t("leaderboard.eligible") : t("leaderboard.betsLeft", { count: String(MIN_PRIZE_BETS - entry.betCount) }),
    entry.isYou ? t("h2h.you") : entry.rank <= 3 ? t("leaderboard.podium") : null,
  ].filter(Boolean);

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {badges.map((badge) => (
        <span
          key={badge}
          className={`rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide ${
            badge === t("leaderboard.eligible") || badge === t("leaderboard.prizeZone") || badge === t("leaderboard.podium")
              ? "bg-[var(--color-card-yes-dim)] text-[var(--color-card-yes)]"
              : badge === t("h2h.you") || badge === t("card.preview")
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
  const { t } = useI18n();
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
            {entry.isYou && <span className="ml-1 text-[9px] opacity-60">{t("h2h.youSuffix")}</span>}
          </span>
          <span className="truncate text-[9px] text-[var(--color-card-muted)]">
            {entry.isPreview ? t("h2h.previewRow") : entry.username ? `@${entry.username}` : t("leaderboard.unclaimed")} / {eligible ? t("leaderboard.eligible") : t("leaderboard.betsToQualify", { count: String(MIN_PRIZE_BETS - entry.betCount) })}
          </span>
          {entry.countryName && (
            <span className="truncate text-[9px] font-bold text-[var(--color-brand-primary)]">
              {entry.countryName}
            </span>
          )}
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
          <span className="text-[9px] text-[var(--color-card-muted)]">{t("leaderboard.estimatedPayout", { amount: formatMoney(payout) })}</span>
        )}
      </div>
      <div className="flex flex-col items-end">
        <span className="text-xs text-[var(--color-card-muted)] text-right">{entry.betCount}</span>
        <span className={`text-[9px] font-bold ${delta >= 0 ? "text-[var(--color-card-yes)]" : "text-[var(--color-card-no)]"}`}>
          {delta === 0 ? t("leaderboard.new") : `${delta > 0 ? "+" : ""}${delta}`}
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
  const { t } = useI18n();
  const pnl = entry.bankroll - STARTING_BANKROLL;
  const eligible = entry.betCount >= MIN_PRIZE_BETS;
  const payout = projectedPayout(entry.rank);
  const isPreview = Boolean(entry.isPreview);

  return (
    <div className="fixed inset-0 z-[100] flex items-end bg-black/60 px-4 pb-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label={t("leaderboard.closeProfilePreview")} />
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
              <p className="text-xs text-[var(--color-card-muted)]">{isPreview ? t("h2h.previewRow") : entry.username ? `@${entry.username}` : t("leaderboard.profileUnclaimed")}</p>
              {entry.countryName && <p className="mt-0.5 text-xs font-bold text-[var(--color-brand-primary)]">{entry.countryName}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-[var(--color-card-border)] px-3 py-2 text-[10px] font-black text-[var(--color-card-text)]">
            {t("shared.close")}
          </button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            [t("leaderboard.rank"), `#${entry.rank}`],
            [t("leaderboard.bankroll"), formatMoney(entry.bankroll)],
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
            {eligible ? t("leaderboard.prizeEligible") : t("leaderboard.moreBetsPrizeEligible", { count: String(MIN_PRIZE_BETS - entry.betCount) })}
          </p>
          <p className="mt-1 text-xs text-[var(--color-card-muted)]">
            {payout > 0 && eligible ? t("leaderboard.projectedPayoutRank", { amount: formatMoney(payout) }) : t("leaderboard.top10SplitSeason")}
          </p>
        </div>
        <div className="mt-4 flex gap-2">
          {!isPreview && entry.username && (
            <Link href={`/profile?u=${encodeURIComponent(entry.username)}`} className="flex-1 rounded-lg bg-[var(--color-brand-primary)] px-4 py-3 text-center text-xs font-black text-white">
              {t("profile.openProfile")}
            </Link>
          )}
          <button type="button" onClick={() => navigator.clipboard?.writeText(`${shareText(entry)} https://thecard.bet/leaderboard`)} className="flex-1 rounded-lg border border-[var(--color-card-border)] px-4 py-3 text-xs font-black text-[var(--color-card-text)]">
            {t("leaderboard.copyRank")}
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
  const { t } = useI18n();
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
        <span className="text-xs text-[var(--color-card-muted)]">{t("auth.loading")}</span>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] divide-y divide-[var(--color-card-border)]">
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--color-card-muted)] uppercase tracking-wider">{t("home.forecaster")}</span>
          <span className="text-xs font-semibold text-[var(--color-card-muted)] uppercase tracking-wider">{t("leaderboard.calibrationTab")}</span>
        </div>
        <div className="px-4 py-8 flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-semibold text-[var(--color-card-text)]">{t("leaderboard.noForecasters")}</p>
          <p className="text-xs text-[var(--color-card-muted)] max-w-xs leading-relaxed">
            {t("leaderboard.noForecastersBody")}
          </p>
          <Link href="/forecast" className="mt-2 text-xs font-semibold text-[var(--color-card-accent)] border border-[var(--color-card-accent-dim)] rounded-lg px-4 py-1.5 hover:bg-[var(--color-card-accent-dim)] transition-colors">
            {t("leaderboard.startPredictingFree")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] divide-y divide-[var(--color-card-border)]">
      <div className="px-4 py-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--color-card-muted)] uppercase tracking-wider">{t("home.forecaster")}</span>
        <span className="text-xs font-semibold text-[var(--color-card-muted)] uppercase tracking-wider">{t("leaderboard.calibrationTab")}</span>
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
        <p className="text-[10px] text-[var(--color-card-muted)]">
          {entry.resolvedCount} predictions{entry.countryName ? ` / ${entry.countryName}` : ""}
        </p>
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
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-4">
      {/* Tab switcher */}
      <div className="flex rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-1 gap-1">
        {(["season", "calibration"] as Tab[]).map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className="flex-1 rounded-lg py-2 text-xs font-bold transition-all"
            style={{
              backgroundColor: tab === item ? "var(--color-brand-primary)" : "transparent",
              color: tab === item ? "#fff" : "var(--color-card-muted)",
            }}
          >
            {item === "season" ? t("leaderboard.seasonTab") : t("leaderboard.calibrationTab")}
          </button>
        ))}
      </div>

      {tab === "season" ? <SeasonTab /> : <CalibrationTab />}
    </div>
  );
}
