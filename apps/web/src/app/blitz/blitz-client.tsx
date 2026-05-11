"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { AskTheCardAi } from "@/components/ask-the-card-ai";
import { ExplainBetting } from "@/components/explain-betting";
import { DAILY_MARKETS, getDailyOutcomes } from "@/lib/daily-markets";
import {
  blitzDateId,
  getStoredBlitzRun,
  saveBlitzRun,
  scoreBlitzRun,
  subscribeBlitzLeaderboard,
  type BlitzLeaderboardEntry,
  type BlitzPick,
} from "@/lib/blitz-store";
import { useAuth } from "@/contexts/auth-context";
import { EmailVerificationNotice } from "@/components/email-verification-notice";
import { SignInSheet } from "@/components/sign-in-sheet";
import { ScoutFloaters } from "@/components/scout-mascot";
import type { DailyMarket } from "@/lib/daily-markets";

const SECS = 15;
const STORAGE_KEY = "blitz_v1";
const HISTORY_KEY = "blitz_history_v1";
const PRACTICE_MARKETS = DAILY_MARKETS.map((market, index) => ({
  ...market,
  id: `practice-${market.id}`,
  question: [
    "Home favorite wins the late window",
    "Star scorer clears their prop",
    "Underdog keeps it inside the number",
    "Bullpen closes a one-run lead",
    "Power play produces a goal",
  ][index] ?? market.question,
}));

const BLITZ_EXPLANATION = [
  {
    title: "What Blitz is",
    body: "Blitz is the speed round. You get five daily markets and fifteen seconds on each one. The format rewards fast, accurate reads instead of long ticket building.",
  },
  {
    title: "Before the clock",
    body: "You can scout the slate and choose one power pick. If that market is correct, it doubles that market's points, so the best power pick is usually the spot where you have the clearest edge.",
  },
  {
    title: "Scoring",
    body: "Correct picks earn points, streaks add bonuses, and faster answers create better timing tiers. A perfect 5-for-5 run gets a badge even if someone else finished faster.",
  },
  {
    title: "Ranked vs warm-up",
    body: "Ranked runs count once per day on the leaderboard. Warm-up mode lets you practice with mock rounds and does not affect your official score.",
  },
];

const BLITZ_AI_SUGGESTIONS = [
  "How should I choose my power pick?",
  "What is today's par?",
  "Do speed tiers change my score?",
];

type Pick = BlitzPick;
type BoardFilter = "today" | "perfect" | "friends" | "week";

interface SavedGame {
  date: string;
  picks: Pick[];
  times: number[];
  powerMarketId?: string | null;
  score?: number;
  correct?: number;
  avgTime?: number;
  bestStreak?: number;
  perfectRun?: boolean;
  practice?: boolean;
  completedAtMs?: number;
}

interface RunMetrics {
  score: number;
  correct: number;
  avgTime: number;
  bestStreak: number;
  perfectRun: boolean;
  parScore: number;
  noSkip: boolean;
  rareHits: number;
  favoriteBias: string;
  bestPick: string;
  missedPick: string;
  badge: string;
  rank: number | null;
}

function todayStr() {
  return blitzDateId();
}

function dailyTheme() {
  const themes = ["Upset Watch", "Late Slate", "Chalk Test", "Prop Sprint", "Rivalry Reads"];
  const seed = todayStr().split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return themes[seed % themes.length]!;
}

function loadSaved(): SavedGame | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const game = JSON.parse(raw) as SavedGame;
    return game.date === todayStr() ? game : null;
  } catch {
    return null;
  }
}

function loadHistory(): SavedGame[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const history = JSON.parse(raw) as SavedGame[];
    return Array.isArray(history) ? history.slice(0, 14) : [];
  } catch {
    return [];
  }
}

function persist(picks: Pick[], times: number[], powerMarketId?: string | null) {
  const scored = scoreBlitzRun(picks, times, powerMarketId);
  const saved: SavedGame = {
    date: todayStr(),
    picks,
    times,
    powerMarketId: powerMarketId ?? null,
    completedAtMs: Date.now(),
    ...scored,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  persistHistory(saved);
  return saved;
}

function persistHistory(run: SavedGame) {
  if (typeof window === "undefined" || run.practice) return;
  const next = [run, ...loadHistory().filter((item) => item.date !== run.date)].slice(0, 14);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

function timeUntilMidnight(): string {
  const now = new Date();
  const midnightUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const ms = midnightUtc.getTime() - now.getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

function marketDifficulty(market: DailyMarket): "Chalk" | "Toss-up" | "Trap" | "Longshot" {
  const favorite = Math.max(market.yes, market.no);
  if (favorite >= 70) return "Chalk";
  if (favorite <= 55) return "Toss-up";
  if (Math.abs(market.yes - market.no) <= 18) return "Trap";
  return "Longshot";
}

function marketNote(market: DailyMarket): string {
  const diff = marketDifficulty(market);
  if (diff === "Chalk") return "Obvious side, but the miss hurts.";
  if (diff === "Toss-up") return "Pure read. No hiding in the price.";
  if (diff === "Trap") return "Looks clean until the clock starts.";
  return "Low-probability hit can swing the recap.";
}

function responseTier(time: number): string {
  if (time <= 5) return "Snap call";
  if (time <= 10) return "Read";
  return "Late lean";
}

function practiceOutcomes(): Record<string, "yes" | "no"> {
  return Object.fromEntries(PRACTICE_MARKETS.map((market, index) => [market.id, index % 2 === 0 ? "yes" : "no"]));
}

function pointBreakdown(
  market: DailyMarket,
  pick: Pick,
  outcome: "yes" | "no",
  time: number,
  index: number,
  powerMarketId?: string | null
) {
  const correct = pick !== "skip" && pick === outcome;
  if (!correct) return { total: 0, base: 0, comeback: 0, power: 0 };
  const base = time <= 5 ? 2 : 1;
  const comeback = index >= DAILY_MARKETS.length - 2 ? 1 : 0;
  const subtotal = base + comeback;
  const power = market.id === powerMarketId ? subtotal : 0;
  return { total: subtotal + power, base, comeback, power };
}

function getMetrics(
  markets: DailyMarket[],
  picks: Pick[],
  times: number[],
  outcomes: Record<string, "yes" | "no">,
  leaderboard: BlitzLeaderboardEntry[],
  powerMarketId?: string | null
): RunMetrics {
  let score = 0;
  let correct = 0;
  let streak = 0;
  let bestStreak = 0;
  const validTimes: number[] = [];
  markets.forEach((market, index) => {
    const pick = picks[index] ?? "skip";
    const time = times[index] ?? SECS;
    if (pick !== "skip") validTimes.push(time);
    if (pick !== "skip" && pick === outcomes[market.id]) {
      correct += 1;
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
      score += pointBreakdown(market, pick, outcomes[market.id]!, time, index, powerMarketId).total;
    } else {
      streak = 0;
    }
  });
  if (bestStreak >= 3) score += 1;
  const avgTime = validTimes.length > 0
    ? Math.round((validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length) * 10) / 10
    : 0;
  const perfectRun = correct === markets.length;
  const parScore = 7 + (markets.filter((market) => marketDifficulty(market) === "Toss-up").length > 1 ? 1 : 0);
  const noSkip = picks.length === markets.length && picks.every((pick) => pick !== "skip");
  const rareHits = picks.filter((pick, index) => {
    const market = markets[index];
    if (!market || pick === "skip" || pick !== outcomes[market.id]) return false;
    const pickedPrice = pick === "yes" ? market.yes : market.no;
    return pickedPrice < 45;
  }).length;
  const favoritePicks = picks.filter((pick, index) => {
    const market = markets[index];
    if (!market || pick === "skip") return false;
    const favorite = market.yes >= market.no ? "yes" : "no";
    return pick === favorite;
  }).length;
  const answered = picks.filter((pick) => pick !== "skip").length || 1;
  const favoriteRate = Math.round((favoritePicks / answered) * 100);
  const favoriteBias = favoriteRate >= 70 ? "Favorite-heavy" : favoriteRate <= 35 ? "Underdog hunter" : "Balanced reader";
  const perMarket = markets.map((market, index) => {
    const pick = picks[index] ?? "skip";
    const outcome = outcomes[market.id]!;
    const points = pointBreakdown(market, pick, outcome, times[index] ?? SECS, index, powerMarketId).total;
    return { market, pick, outcome, points };
  });
  const best = [...perMarket].sort((a, b) => b.points - a.points)[0];
  const missed = perMarket.find((item) => item.pick !== "skip" && item.pick !== item.outcome) ?? perMarket.find((item) => item.pick === "skip");
  const rank = leaderboard.findIndex((entry) => entry.score <= score) + 1 || null;
  return {
    score,
    correct,
    avgTime,
    bestStreak,
    perfectRun,
    parScore,
    noSkip,
    rareHits,
    favoriteBias,
    bestPick: best ? best.market.question : "No best pick yet",
    missedPick: missed ? missed.market.question : "Clean card",
    badge: perfectRun ? "Perfect Run" : bestStreak >= 3 ? "Streak Heat" : rareHits > 0 ? "Rare Hit" : noSkip ? "No Skip" : "First Read",
    rank,
  };
}

function shareText(metrics: RunMetrics): string {
  const speed = metrics.avgTime > 0 ? `, ${metrics.avgTime}s avg` : "";
  return `I scored ${metrics.score} on today's ${dailyTheme()} Blitz at The Card (${metrics.correct}/${DAILY_MARKETS.length}${speed}, ${metrics.badge}).`;
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-1)] px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-black text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}

function IntroScreen({
  saved,
  history,
  powerMarketId,
  onPowerMarketChange,
  onStart,
  onPractice,
  onViewResults,
}: {
  saved: SavedGame | null;
  history: SavedGame[];
  powerMarketId: string | null;
  onPowerMarketChange: (id: string) => void;
  onStart: () => void;
  onPractice: () => void;
  onViewResults: () => void;
}) {
  const outcomes = getDailyOutcomes();
  const metrics = saved
    ? getMetrics(DAILY_MARKETS, saved.picks, saved.times, outcomes, [], saved.powerMarketId)
    : null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 pb-24">
      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="flex min-h-[320px] flex-col justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-6">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{dailyTheme()}</p>
            <h1 className="text-5xl font-display font-black tracking-tight text-[var(--color-text-primary)]">Blitz</h1>
            <p className="max-w-lg text-base leading-relaxed text-[var(--color-text-secondary)]">
              Five markets. Fifteen seconds each. The deeper scouting lives here, outside the clock.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatPill label="Par" value="7+" />
            <StatPill label="Ghost" value="12 pts" />
            <StatPill label="Snap" value="under 5s" />
            <StatPill label="Streak" value="+1 at 3" />
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5">
          {saved && metrics ? (
            <div className="flex h-full flex-col justify-between gap-5 text-center">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)]">Already played today</p>
                <p className="mt-3 text-6xl font-display font-black text-[var(--color-brand-primary)]">{metrics.score}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {metrics.correct}/{DAILY_MARKETS.length} correct - {metrics.badge}
                </p>
              </div>
              <button
                onClick={onViewResults}
                className="w-full rounded-xl bg-[var(--color-brand-primary)] py-4 text-base font-black text-white transition-all hover:bg-red-500 active:scale-[0.98]"
              >
                See Breakdown
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Power pick</p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">Choose one market before the clock. Correct doubles that market&apos;s points.</p>
              </div>
              <div className="flex flex-col gap-2">
                {DAILY_MARKETS.map((market) => (
                  <button
                    key={market.id}
                    onClick={() => onPowerMarketChange(market.id)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                      powerMarketId === market.id
                        ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 text-[var(--color-text-primary)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:border-[var(--color-brand-primary)]/50"
                    }`}
                  >
                    <span className="font-bold">{market.sport}</span> - {market.question}
                  </button>
                ))}
              </div>
              <button onClick={onStart} className="w-full rounded-xl bg-[var(--color-brand-primary)] py-4 text-base font-black text-white transition-all hover:bg-red-500 active:scale-[0.98]">
                Play Ranked
              </button>
              <button onClick={onPractice} className="w-full rounded-xl border border-[var(--color-border)] py-3 text-sm font-bold text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-brand-primary)]/50">
                Warm-up Mode
              </button>
            </div>
          )}
        </div>
      </section>

      <ExplainBetting
        buttonLabel="Explain Blitz betting"
        title="Blitz turns five markets into a timed daily score attack."
        summary="You still answer YES or NO, but the twist is pressure: speed, streaks, the power pick, and perfect-run badges all shape the final leaderboard score."
        sections={BLITZ_EXPLANATION}
      />

      <AskTheCardAi
        mode="blitz"
        context="On this page, scout the five markets before the timer, choose a power pick, then play one ranked run where speed, accuracy, and streaks determine your score."
        suggestions={BLITZ_AI_SUGGESTIONS}
      />

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Today&apos;s Slate</p>
            <p className="text-xs font-bold text-[var(--color-text-muted)]">Scout now. Speed later.</p>
          </div>
          <div className="grid gap-3">
            {DAILY_MARKETS.map((market) => (
              <div key={market.id} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-[var(--color-surface-3)] px-2 py-1 text-[10px] font-black uppercase text-[var(--color-text-muted)]">{market.sport}</span>
                  <span className="rounded-md border border-[var(--color-border)] px-2 py-1 text-[10px] font-black uppercase text-[var(--color-brand-primary)]">{marketDifficulty(market)}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">{market.yes}c YES / {market.no}c NO</span>
                </div>
                <p className="mt-2 text-sm font-bold text-[var(--color-text-primary)]">{market.question}</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">{marketNote(market)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5">
          <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Blitz History</p>
          {history.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--color-text-muted)]">Your last 14 ranked runs will appear here after you play.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              {history.slice(0, 7).map((run) => (
                <div key={run.date} className="grid grid-cols-[1fr_56px_64px] items-center gap-2 rounded-lg bg-[var(--color-surface-2)] px-3 py-2">
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">{run.date}</span>
                  <span className="text-right text-sm font-black text-[var(--color-brand-primary)]">{run.score ?? 0}</span>
                  <span className="text-right text-xs text-[var(--color-text-muted)]">{run.correct ?? 0}/5</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function PlayingScreen({
  market,
  qIdx,
  total,
  timeLeft,
  flash,
  feedback,
  onPick,
}: {
  market: DailyMarket;
  qIdx: number;
  total: number;
  timeLeft: number;
  flash: "yes" | "no" | null;
  feedback: string | null;
  onPick: (c: "yes" | "no") => void;
}) {
  const pct = Math.max(0, (timeLeft / SECS) * 100);
  const timerColor =
    timeLeft > 7
      ? "var(--color-success)"
      : timeLeft > 4
      ? "var(--color-warning)"
      : "var(--color-danger)";

  return (
    <div className="mx-auto flex max-w-lg flex-col px-4" style={{ height: "calc(100dvh - 80px)" }}>
      <div className="mt-4 h-1.5 flex-shrink-0 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: timerColor, transition: "width 0.1s linear, background 0.5s" }} />
      </div>

      <div className="mt-4 flex flex-shrink-0 items-center justify-between">
        <div className="flex gap-2">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                i < qIdx ? "bg-[var(--color-text-muted)]" : i === qIdx ? "bg-[var(--color-brand-primary)]" : "bg-[var(--color-surface-3)]"
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-black tabular-nums" style={{ color: timerColor }}>
          {Math.ceil(timeLeft)}s
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-5 py-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{market.sport}</span>
          <span className="rounded-md border border-[var(--color-border)] px-2 py-1 text-[10px] font-black uppercase text-[var(--color-text-muted)]">
            {marketDifficulty(market)}
          </span>
        </div>
        <h2 className="text-3xl font-display font-black leading-tight tracking-tight text-[var(--color-text-primary)]">{market.question}</h2>
        <div className="flex gap-4 text-sm text-[var(--color-text-muted)]">
          <span><span className="font-black text-[var(--color-success)]">{market.yes}c</span> YES</span>
          <span>-</span>
          <span><span className="font-black text-[var(--color-danger)]">{market.no}c</span> NO</span>
        </div>
        {feedback && (
          <div className="rounded-xl border border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/10 px-4 py-3 text-center text-sm font-black text-[var(--color-brand-primary)]">
            {feedback}
          </div>
        )}
      </div>

      <div className="flex flex-shrink-0 flex-col gap-3 pb-6">
        <button
          onClick={() => onPick("yes")}
          className={`w-full rounded-xl py-6 text-2xl font-black transition-all active:scale-[0.97] ${
            flash === "yes" ? "bg-[var(--color-success)] text-white" : "bg-[var(--color-success-dim)] text-[var(--color-success)] hover:bg-[var(--color-success)] hover:text-white"
          }`}
        >
          YES
        </button>
        <button
          onClick={() => onPick("no")}
          className={`w-full rounded-xl py-6 text-2xl font-black transition-all active:scale-[0.97] ${
            flash === "no" ? "bg-[var(--color-danger)] text-white" : "bg-[var(--color-danger-dim)] text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white"
          }`}
        >
          NO
        </button>
      </div>
    </div>
  );
}

function ResultsScreen({
  picks,
  times,
  outcomes,
  leaderboard,
  leaderboardLoading,
  leaderboardError,
  userId,
  currentEntry,
  shareStatus,
  powerMarketId,
  practice,
  onShare,
  onCopyChallenge,
  onPracticeAgain,
}: {
  picks: Pick[];
  times: number[];
  outcomes: Record<string, "yes" | "no">;
  leaderboard: BlitzLeaderboardEntry[];
  leaderboardLoading: boolean;
  leaderboardError: string | null;
  userId: string | null;
  currentEntry: BlitzLeaderboardEntry | null;
  shareStatus: string | null;
  powerMarketId: string | null;
  practice: boolean;
  onShare: (metrics: RunMetrics) => void;
  onCopyChallenge: (metrics: RunMetrics) => void;
  onPracticeAgain: () => void;
}) {
  const markets = practice ? PRACTICE_MARKETS : DAILY_MARKETS;
  const metrics = getMetrics(markets, picks, times, outcomes, leaderboard, powerMarketId);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 pb-24">
      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-6">
          <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{practice ? "Warm-up Results" : "Blitz Results"}</p>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <span className="text-7xl font-display font-black text-[var(--color-text-primary)]">{metrics.score}</span>
            <span className="pb-2 text-xl text-[var(--color-text-muted)]">pts</span>
            <span className="mb-3 rounded-full bg-[var(--color-brand-primary)]/10 px-3 py-1 text-xs font-black uppercase text-[var(--color-brand-primary)]">{metrics.badge}</span>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {metrics.correct}/{markets.length} correct - avg {metrics.avgTime || 0}s - par {metrics.parScore}
            {metrics.rank && !practice ? ` - projected rank #${metrics.rank}` : ""}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatPill label="Streak" value={metrics.bestStreak} />
            <StatPill label="Ghost" value={metrics.score >= 12 ? "beat" : `${12 - metrics.score} back`} />
            <StatPill label="No Skip" value={metrics.noSkip ? "yes" : "no"} />
            <StatPill label="Rare Hits" value={metrics.rareHits} />
          </div>
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">
            Calibration read: {metrics.favoriteBias}. Next card in {timeUntilMidnight()}.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5">
          <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Recap Card</p>
          <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
            <p className="text-sm font-black text-[var(--color-text-primary)]">{dailyTheme()} Blitz</p>
            <p className="mt-3 text-4xl font-display font-black text-[var(--color-brand-primary)]">{metrics.score} pts</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">{metrics.correct}/5 correct - {metrics.badge}</p>
            <div className="mt-4 border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-text-secondary)]">
              <p><span className="font-black">Best:</span> {metrics.bestPick}</p>
              <p className="mt-2"><span className="font-black">Study:</span> {metrics.missedPick}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <button onClick={() => onShare(metrics)} className="rounded-xl bg-[var(--color-surface-2)] py-3 text-sm font-black text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-surface-3)]">
              Share Result
            </button>
            <button onClick={() => onCopyChallenge(metrics)} className="rounded-xl border border-[var(--color-border)] py-3 text-sm font-bold text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-brand-primary)]/50">
              Copy Friend Challenge
            </button>
            {shareStatus && <p className="text-center text-xs font-semibold text-[var(--color-success)]">{shareStatus}</p>}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] overflow-hidden">
          {markets.map((market, index) => {
            const pick = picks[index] ?? "skip";
            const outcome = outcomes[market.id]!;
            const time = times[index] ?? SECS;
            const breakdown = pointBreakdown(market, pick, outcome, time, index, powerMarketId);
            const isCorrect = pick !== "skip" && pick === outcome;
            const pickedPrice = pick === "yes" ? market.yes : market.no;
            return (
              <div key={market.id} className="grid gap-3 border-b border-[var(--color-border)] px-4 py-4 last:border-0 sm:grid-cols-[28px_1fr_92px] sm:items-center">
                <span className={`text-xl font-black ${isCorrect ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
                  {pick === "skip" ? "-" : isCorrect ? "✓" : "×"}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-[var(--color-text-primary)]">{market.question}</p>
                    {market.id === powerMarketId && <span className="rounded-md bg-[var(--color-brand-primary)]/10 px-2 py-1 text-[10px] font-black uppercase text-[var(--color-brand-primary)]">Power</span>}
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {pick === "skip" ? "Timed out" : `You: ${pick.toUpperCase()} (${pickedPrice}c)`}
                    {" - "}
                    Correct: {outcome.toUpperCase()} - {responseTier(time)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{marketNote(market)}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className={`text-lg font-black ${breakdown.total > 0 ? "text-[var(--color-success)]" : "text-[var(--color-text-muted)]"}`}>{breakdown.total > 0 ? `+${breakdown.total}` : "0"}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">
                    {breakdown.comeback > 0 ? "+ comeback " : ""}
                    {breakdown.power > 0 ? "+ power" : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-4">
          <BlitzLeaderboard entries={leaderboard} userId={userId} currentEntry={practice ? null : currentEntry} loading={leaderboardLoading} error={leaderboardError} />
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5">
            <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Next Move</p>
            <div className="mt-4 flex flex-col gap-2">
              {practice ? (
                <button onClick={onPracticeAgain} className="rounded-xl bg-[var(--color-brand-primary)] py-4 text-sm font-black text-white transition-all hover:bg-red-500">
                  Run Another Warm-up
                </button>
              ) : (
                <Link href="/h2h" className="rounded-xl bg-[var(--color-brand-primary)] py-4 text-center text-sm font-black text-white transition-all hover:bg-red-500">
                  Challenge H2H
                </Link>
              )}
              <Link href="/card" className="rounded-xl border border-[var(--color-border)] py-3 text-center text-sm font-bold text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-brand-primary)]/50">
                Open Full Card
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function BlitzLeaderboard({
  entries,
  userId,
  currentEntry,
  loading,
  error,
}: {
  entries: BlitzLeaderboardEntry[];
  userId: string | null;
  currentEntry: BlitzLeaderboardEntry | null;
  loading: boolean;
  error: string | null;
}) {
  const [filter, setFilter] = useState<BoardFilter>("today");
  const filtered = entries.filter((entry) => {
    if (filter === "perfect") return entry.perfectRun;
    if (filter === "friends") return userId ? entry.uid === userId : false;
    return true;
  });
  const rows = filtered.slice(0, 8);
  const showCurrentEntry = currentEntry && !rows.some((entry) => entry.uid === currentEntry.uid);

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] overflow-hidden">
      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Today&apos;s Blitz Board</p>
          <Link href="/leaderboard" className="text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">All boards</Link>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1 rounded-lg bg-[var(--color-surface-2)] p-1">
          {(["today", "week", "friends", "perfect"] as BoardFilter[]).map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-md px-2 py-1.5 text-[10px] font-black uppercase ${filter === item ? "bg-[var(--color-brand-primary)] text-white" : "text-[var(--color-text-muted)]"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      {loading && (
        <div className="px-4 py-8 text-center">
          <p className="text-sm font-black text-[var(--color-text-primary)]">Loading today&apos;s board</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">Official ranked runs only.</p>
        </div>
      )}
      {!loading && error && (
        <div className="px-4 py-8 text-center">
          <p className="text-sm font-black text-[var(--color-danger)]">Could not load Blitz board</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{error}</p>
        </div>
      )}
      {!loading && !error && rows.length === 0 && (
        <div className="px-4 py-8 text-center">
          <p className="text-sm font-black text-[var(--color-text-primary)]">No ranked runs yet</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {filter === "today" ? "Be the first verified player on today's board." : "No entries match this filter yet."}
          </p>
        </div>
      )}
      {!loading && !error && rows.map((entry, index) => {
        const isYou = userId === entry.uid;
        return (
          <BlitzLeaderboardRow key={entry.uid} entry={entry} rankLabel={String(index + 1)} isYou={isYou} />
        );
      })}
      {!loading && !error && showCurrentEntry && currentEntry && (
        <div className="border-t border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/10">
          <div className="px-4 pt-3 text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Your rank</div>
          <BlitzLeaderboardRow entry={currentEntry} rankLabel={entries.length >= 25 ? "25+" : String(entries.length + 1)} isYou />
        </div>
      )}
    </div>
  );
}

function BlitzLeaderboardRow({
  entry,
  rankLabel,
  isYou,
}: {
  entry: BlitzLeaderboardEntry;
  rankLabel: string;
  isYou: boolean;
}) {
  const name = (
    <p className={`truncate text-sm font-bold ${isYou ? "text-[var(--color-brand-primary)]" : "text-[var(--color-text-primary)]"}`}>
      {entry.displayName}{isYou ? " (you)" : ""}{entry.perfectRun ? " - Perfect" : ""}
    </p>
  );

  return (
    <div className={`grid grid-cols-[28px_1fr_52px_52px] items-center gap-2 border-b border-[var(--color-border)] px-4 py-3 last:border-0 ${isYou ? "bg-[var(--color-brand-primary)]/10" : ""}`}>
      <span className="text-right text-xs font-black text-[var(--color-text-muted)]">{rankLabel}</span>
      <div className="min-w-0">
        {entry.username ? (
          <Link href={`/profile?u=${encodeURIComponent(entry.username)}`} className="hover:underline">
            {name}
          </Link>
        ) : name}
        <p className="text-[10px] text-[var(--color-text-muted)]">{entry.correct}/{DAILY_MARKETS.length} correct - streak {entry.bestStreak ?? "-"} - avg {entry.avgTime || "-"}s</p>
      </div>
      <span className="text-right text-sm font-black text-[var(--color-text-primary)]">{entry.score}</span>
      <span className="text-right text-xs font-bold text-[var(--color-text-muted)]">{entry.avgTime || "-"}s</span>
    </div>
  );
}

export function BlitzClient() {
  const { user, verificationRequired } = useAuth();
  const outcomes = getDailyOutcomes();

  const [phase, setPhase] = useState<"intro" | "playing" | "done">("intro");
  const [qIdx, setQIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(SECS);
  const [flash, setFlash] = useState<"yes" | "no" | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedGame | null>(null);
  const [history, setHistory] = useState<SavedGame[]>([]);
  const [signInOpen, setSignInOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<BlitzLeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [powerMarketId, setPowerMarketId] = useState<string | null>(DAILY_MARKETS[0]?.id ?? null);
  const [practice, setPractice] = useState(false);

  const gameRef = useRef<{ picks: Pick[]; times: number[] }>({ picks: [], times: [] });
  const lockedRef = useRef(false);
  const qStartRef = useRef(Date.now());
  const [finalPicks, setFinalPicks] = useState<Pick[]>([]);
  const [finalTimes, setFinalTimes] = useState<number[]>([]);

  useEffect(() => {
    setSaved(loadSaved());
    setHistory(loadHistory());
  }, []);

  useEffect(() => subscribeBlitzLeaderboard(blitzDateId(), (entries) => {
    setLeaderboard(entries);
    setLeaderboardLoading(false);
    setLeaderboardError(null);
  }, () => {
    setLeaderboardLoading(false);
    setLeaderboardError("Refresh the page or try again after today's first official runs land.");
  }), []);

  useEffect(() => {
    if (!user || verificationRequired) return;
    getStoredBlitzRun(user.uid)
      .then((run) => {
        if (!run) return;
        const savedRun: SavedGame = {
          date: todayStr(),
          picks: run.picks,
          times: run.times,
          powerMarketId: run.powerMarketId ?? null,
          score: run.score,
          correct: run.correct,
          avgTime: run.avgTime,
          bestStreak: run.bestStreak,
          perfectRun: run.perfectRun,
          completedAtMs: run.completedAtMs,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedRun));
        setSaved(savedRun);
        persistHistory(savedRun);
        setHistory(loadHistory());
      })
      .catch(() => setSaveError("Could not load today's Blitz result."));
  }, [user, verificationRequired]);

  const finishQuestion = useCallback((choice: Pick) => {
    if (lockedRef.current) return;
    lockedRef.current = true;

    const elapsed = Math.min(SECS, Math.max(1, Math.round((Date.now() - qStartRef.current) / 1000)));
    const markets = practice ? PRACTICE_MARKETS : DAILY_MARKETS;
    const activeOutcomes = practice ? practiceOutcomes() : outcomes;
    const market = markets[qIdx]!;
    const breakdown = pointBreakdown(market, choice, activeOutcomes[market.id]!, elapsed, qIdx, practice ? null : powerMarketId);

    gameRef.current.picks.push(choice);
    gameRef.current.times.push(elapsed);

    if (choice !== "skip") setFlash(choice);
    setFeedback(choice === "skip" ? "Timed out" : `${choice === activeOutcomes[market.id] ? "Correct" : "Miss"} - ${responseTier(elapsed)}${breakdown.total > 0 ? ` +${breakdown.total}` : ""}`);

    const nextIdx = gameRef.current.picks.length;
    const done = nextIdx >= markets.length;

    setTimeout(() => {
      setFlash(null);
      setFeedback(null);
      if (done) {
        const { picks, times } = gameRef.current;
        const savedRun = practice
          ? ({ date: todayStr(), picks, times, practice: true, ...scoreBlitzRun(picks, times) } satisfies SavedGame)
          : persist(picks, times, powerMarketId);
        setSaved(practice ? saved : savedRun);
        setHistory(loadHistory());
        setFinalPicks([...picks]);
        setFinalTimes([...times]);
        setPhase("done");
        if (!practice && user && !verificationRequired) {
          saveBlitzRun(user.uid, picks, times, {
            displayName: user.displayName || user.email?.split("@")[0] || "You",
            photoURL: user.photoURL,
          }, blitzDateId(), powerMarketId).catch(() => {
            setSaveError("Your result is saved locally, but could not sync to your account.");
          });
        }
      } else {
        lockedRef.current = false;
        setQIdx(nextIdx);
        setTimeLeft(SECS);
        qStartRef.current = Date.now();
      }
    }, choice === "skip" ? 100 : 650);
  }, [outcomes, powerMarketId, practice, qIdx, saved, user, verificationRequired]);

  useEffect(() => {
    if (phase !== "playing") return;
    qStartRef.current = Date.now();
    const start = Date.now();

    const id = setInterval(() => {
      const remaining = SECS - (Date.now() - start) / 1000;
      if (remaining <= 0) {
        clearInterval(id);
        finishQuestion("skip");
      } else {
        setTimeLeft(remaining);
      }
    }, 100);

    return () => clearInterval(id);
  }, [phase, qIdx, finishQuestion]);

  function startGame(isPractice: boolean) {
    if (!isPractice && !user) {
      setSignInOpen(true);
      return;
    }
    if (!isPractice && (verificationRequired || saved)) return;
    gameRef.current = { picks: [], times: [] };
    lockedRef.current = false;
    setPractice(isPractice);
    setQIdx(0);
    setTimeLeft(SECS);
    setFlash(null);
    setFeedback(null);
    setShareStatus(null);
    setSaveError(null);
    setPhase("playing");
  }

  async function shareResult(metrics: RunMetrics) {
    const text = shareText(metrics);
    const url = typeof window !== "undefined" ? `${window.location.origin}/blitz` : "https://thecard.bet/blitz";
    setShareStatus(null);
    try {
      if (navigator.share) {
        await navigator.share({ title: "The Card Blitz", text, url });
        setShareStatus("Shared.");
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setShareStatus("Copied to clipboard.");
    } catch {
      setShareStatus("Share canceled.");
    }
  }

  async function copyChallenge(metrics: RunMetrics) {
    const url = typeof window !== "undefined" ? `${window.location.origin}/blitz?challenge=${metrics.score}` : "https://thecard.bet/blitz";
    await navigator.clipboard.writeText(`Beat my ${metrics.score}-point Blitz on The Card: ${url}`);
    setShareStatus("Challenge copied.");
  }

  if (phase === "intro") {
    return (
      <>
        <ScoutFloaters page="blitz" />
        <IntroScreen
          saved={saved}
          history={history}
          powerMarketId={powerMarketId}
          onPowerMarketChange={setPowerMarketId}
          onStart={() => startGame(false)}
          onPractice={() => startGame(true)}
          onViewResults={() => {
            if (!saved) return;
            setPractice(false);
            setFinalPicks(saved.picks);
            setFinalTimes(saved.times);
            setPowerMarketId(saved.powerMarketId ?? null);
            setPhase("done");
          }}
        />
        <div className="mx-auto max-w-lg px-4 pb-24">
          {!user && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4 text-center">
              <p className="text-sm font-bold text-[var(--color-text-primary)]">Sign in to play ranked Blitz</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">Warm-up mode is open. Ranked is one verified run per day.</p>
              <button onClick={() => setSignInOpen(true)} className="mt-3 rounded-lg bg-[var(--color-brand-primary)] px-4 py-2 text-xs font-bold text-white">
                Sign in
              </button>
            </div>
          )}
          {user && verificationRequired && <EmailVerificationNotice compact />}
          {saveError && <p className="mt-3 rounded-lg border border-[var(--color-danger)]/30 px-3 py-2 text-xs text-[var(--color-danger)]">{saveError}</p>}
        </div>
        <SignInSheet open={signInOpen} onClose={() => setSignInOpen(false)} />
      </>
    );
  }

  if (phase === "playing") {
    const markets = practice ? PRACTICE_MARKETS : DAILY_MARKETS;
    return (
      <>
        <ScoutFloaters page="blitz" />
        <PlayingScreen
          market={markets[qIdx]!}
          qIdx={qIdx}
          total={markets.length}
          timeLeft={timeLeft}
          flash={flash}
          feedback={feedback}
          onPick={(choice) => finishQuestion(choice)}
        />
      </>
    );
  }

  const currentEntry: BlitzLeaderboardEntry | null = saved && user
    ? {
        uid: user.uid,
        displayName: user.displayName || user.email?.split("@")[0] || "You",
        photoURL: user.photoURL ?? null,
        score: saved.score ?? 0,
        correct: saved.correct ?? 0,
        avgTime: saved.avgTime ?? 0,
        bestStreak: saved.bestStreak ?? 0,
        perfectRun: saved.perfectRun ?? false,
        completedAtMs: saved.completedAtMs ?? Date.now(),
      }
    : null;

  return (
    <>
      <ScoutFloaters page="blitz" />
      <ResultsScreen
        picks={finalPicks}
        times={finalTimes}
        outcomes={practice ? practiceOutcomes() : outcomes}
        leaderboard={leaderboard}
        leaderboardLoading={leaderboardLoading}
        leaderboardError={leaderboardError}
        userId={user?.uid ?? null}
        currentEntry={currentEntry}
        shareStatus={shareStatus}
        powerMarketId={practice ? null : powerMarketId}
        practice={practice}
        onShare={shareResult}
        onCopyChallenge={copyChallenge}
        onPracticeAgain={() => startGame(true)}
      />
      {saveError && <p className="mx-auto max-w-lg px-4 pb-24 text-xs text-[var(--color-danger)]">{saveError}</p>}
    </>
  );
}
