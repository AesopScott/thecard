"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AskTheCardAi } from "@/components/ask-the-card-ai";
import { ExplainBetting } from "@/components/explain-betting";
import { EmailVerificationNotice } from "@/components/email-verification-notice";
import { SignInSheet } from "@/components/sign-in-sheet";
import { ScoutFloaters } from "@/components/scout-mascot";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
import { DAILY_MARKETS, getDailyOutcomes, getOpponentPicks, type DailyMarket } from "@/lib/daily-markets";
import {
  getStoredH2HRun,
  h2hDateId,
  saveH2HRun,
  scoreH2HRun,
  subscribeH2HLeaderboard,
  type H2HLeaderboardEntry,
  type H2HRun,
  type H2HPick,
} from "@/lib/h2h-store";

type Pick = H2HPick | null;
type MatchMode = "ranked" | "ghost";
type BoardFilter = "today" | "week" | "friends" | "verified" | "wins" | "upsets";

const OPPONENT = {
  name: "MarketMike",
  emoji: "MM",
  record: "12W - 4L",
  winPct: 75,
  avgScore: 3.7,
  upsetRate: 22,
  favoriteSport: "NFL",
  streak: "W3",
};

const STORAGE_KEY = "h2h_v1";
const HISTORY_KEY = "h2h_history_v1";

const H2H_EXPLANATION = [
  {
    title: "What H2H is",
    body: "Head-to-Head gives you and a rival the same five daily markets. You each pick YES or NO, then the match settles after the outcomes are known.",
  },
  {
    title: "Winning the match",
    body: "Most correct reads usually wins, but the score also reflects confidence, upset hits, and swing moments. Ties go to the challenger so a shared score still produces a result.",
  },
  {
    title: "Confidence pick",
    body: "Before locking, you can mark one market as your confidence pick. If it hits, that read is worth more. If it misses, you lose the chance to separate there.",
  },
  {
    title: "Ghost and challenges",
    body: "Ranked mode is for verified daily matches. Ghost mode lets you practice against a mock rival, and challenge links let another player try to beat your posted score.",
  },
];

const H2H_AI_SUGGESTIONS = [
  "How do confidence picks work?",
  "What counts as an upset hit?",
  "How do I beat the rival?",
];

function loadSavedRun(): H2HRun | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const run = JSON.parse(raw) as H2HRun;
    return run.date === h2hDateId() ? normalizeRun(run) : null;
  } catch {
    return null;
  }
}

function loadHistory(): H2HRun[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const history = JSON.parse(raw) as H2HRun[];
    return Array.isArray(history) ? history.map(normalizeRun).slice(0, 12) : [];
  } catch {
    return [];
  }
}

function normalizeRun(run: H2HRun): H2HRun {
  const scored = scoreH2HRun(run.picks, run.opponentPicks, run.outcomes, run.confidenceMarketId);
  return {
    ...run,
    confidenceMarketId: run.confidenceMarketId ?? null,
    yourScore: run.yourScore ?? scored.yourScore,
    opponentScore: run.opponentScore ?? scored.opponentScore,
    upsetHits: run.upsetHits ?? scored.upsetHits,
    swing: run.swing ?? scored.swing,
  };
}

function persistRun(run: H2HRun): void {
  if (typeof window === "undefined") return;
  const normalized = normalizeRun(run);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  persistHistory(normalized);
}

function persistHistory(run: H2HRun): void {
  if (typeof window === "undefined") return;
  const next = [normalizeRun(run), ...loadHistory().filter((item) => item.date !== run.date)].slice(0, 12);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

function buildLocalRun(picks: H2HPick[], confidenceMarketId?: string | null): H2HRun {
  return {
    date: h2hDateId(),
    picks,
    ...scoreH2HRun(picks, getOpponentPicks(), getDailyOutcomes(), confidenceMarketId),
    completedAtMs: Date.now(),
  };
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
  const difficulty = marketDifficulty(market);
  if (difficulty === "Chalk") return "The price expects a clean favorite. Missing here usually decides the match.";
  if (difficulty === "Toss-up") return "This is a pure read market. Small edge, big swing.";
  if (difficulty === "Trap") return "The line looks comfortable, but both sides have a real case.";
  return "Lower-probability side. Correct calls earn the loudest recap.";
}

function dailyRoomName(): string {
  const rooms = ["Ranked Queue", "Rivalry Room", "Upset Court", "Late Slate Duel", "League Trial"];
  const seed = h2hDateId().split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return rooms[seed % rooms.length]!;
}

function ratingFor(history: H2HRun[]): number {
  return 1200 + history.reduce((sum, run) => sum + (run.result === "loss" ? -18 : run.result === "tie-win" ? 8 : 24), 0);
}

function winStreak(history: H2HRun[]): string {
  let streak = 0;
  for (const run of history) {
    if (run.result === "loss") break;
    streak += 1;
  }
  return streak > 0 ? `W${streak}` : "No streak";
}

function shareText(run: H2HRun): string {
  const outcome = run.result === "loss" ? `lost to ${OPPONENT.name}` : run.result === "tie-win" ? `won the tie-break over ${OPPONENT.name}` : `beat ${OPPONENT.name}`;
  return `I ${outcome} in Head-to-Head at The Card: ${run.yourScore}-${run.opponentScore} (${run.yourCorrect}/${DAILY_MARKETS.length} correct, ${run.upsetHits} upset hits).`;
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-black text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}

function IntroScreen({
  savedRun,
  history,
  challengeScore,
  onStart,
  onGhost,
  onViewResults,
  t,
}: {
  savedRun: H2HRun | null;
  history: H2HRun[];
  challengeScore: string | null;
  onStart: () => void;
  onGhost: () => void;
  onViewResults: () => void;
  t: ReturnType<typeof useI18n>["t"];
}) {
  if (savedRun) {
    const youWin = savedRun.result !== "loss";

    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 pb-24">
        <section className={`rounded-xl border p-6 text-center ${youWin ? "border-[var(--color-success)] bg-[var(--color-success-dim)]" : "border-[var(--color-danger)] bg-[var(--color-danger-dim)]"}`}>
          <p className="text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)]">{t("h2h.alreadyPlayed")}</p>
          <h1 className="mt-2 text-4xl font-display font-black tracking-tight">{savedRun.result === "tie-win" ? t("h2h.tieBreakWin") : youWin ? t("h2h.youWin") : t("h2h.opponentWins", { name: OPPONENT.name })}</h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {t("h2h.scoreLine", { yourScore: String(savedRun.yourScore), opponentScore: String(savedRun.opponentScore), name: OPPONENT.name })}
          </p>
        </section>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatPill label="Season rating" value={ratingFor(history)} />
          <StatPill label="Rivalry streak" value={winStreak(history)} />
          <StatPill label="Next match" value={timeUntilMidnight()} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <button onClick={onViewResults} className="rounded-xl bg-[var(--color-brand-primary)] py-4 text-base font-black text-white transition-all hover:bg-red-500 active:scale-[0.98]">
            {t("h2h.seeResults")}
          </button>
          <button onClick={onGhost} className="rounded-xl border border-[var(--color-border)] py-4 text-sm font-bold text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-brand-primary)]/50">
            {t("h2h.ghostRematch")}
          </button>
          <Link href="/leagues" className="rounded-xl border border-[var(--color-border)] py-4 text-center text-sm font-bold text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-brand-primary)]/50">
            {t("h2h.leagueRooms")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-8 pb-24">
      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-6">
          <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{dailyRoomName()}</p>
          <h1 className="mt-2 text-5xl font-display font-black tracking-tight text-[var(--color-text-primary)]">{t("h2h.title")}</h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--color-text-secondary)]">
            {t("h2h.intro")}
          </p>
          {challengeScore && (
            <p className="mt-4 rounded-lg border border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/10 px-3 py-2 text-sm font-bold text-[var(--color-text-primary)]">
              {t("h2h.challengeLoaded", { score: challengeScore })}
            </p>
          )}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatPill label="Queue" value="Verified" />
            <StatPill label="Tie rule" value="You" />
            <StatPill label="Upsets" value="+1" />
            <StatPill label={t("h2h.confidence")} value="2x" />
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5">
          <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("h2h.rivalProfile")}</p>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-3xl font-display font-black text-[var(--color-text-primary)]">{OPPONENT.name}</p>
              <p className="text-sm text-[var(--color-text-muted)]">{OPPONENT.record} - {OPPONENT.winPct}% win rate</p>
            </div>
            <div className="grid h-16 w-16 place-items-center rounded-xl bg-[var(--color-surface-3)] text-xl font-black text-[var(--color-text-primary)]">{OPPONENT.emoji}</div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <StatPill label="Avg score" value={OPPONENT.avgScore} />
            <StatPill label="Upset rate" value={`${OPPONENT.upsetRate}%`} />
            <StatPill label="Hot streak" value={OPPONENT.streak} />
            <StatPill label="Sport lean" value={OPPONENT.favoriteSport} />
          </div>
        </div>
      </section>

      <ExplainBetting
        buttonLabel="Explain H2H betting"
        title="H2H is the same board for both players, settled as a match."
        summary="The mode is less about building the biggest ticket and more about beating one rival on the same five questions. Confidence, upset reads, and tie rules decide close matches."
        sections={H2H_EXPLANATION}
      />

      <AskTheCardAi
        mode="h2h"
        context="On this page, answer the same five markets as the rival, mark one confidence pick, and use upset reads or cleaner accuracy to win the match."
        suggestions={H2H_AI_SUGGESTIONS}
      />

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5">
          <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("h2h.tale")}</p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <StatPill label="You" value={ratingFor(history)} />
            <StatPill label="Edge" value={history.length > 0 ? winStreak(history) : "First match"} />
            <StatPill label={OPPONENT.name} value={OPPONENT.streak} />
          </div>
          <div className="mt-4 grid gap-2">
            {DAILY_MARKETS.map((market) => (
              <div key={market.id} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-[var(--color-surface-3)] px-2 py-1 text-[10px] font-black uppercase text-[var(--color-text-muted)]">{market.sport}</span>
                  <span className="rounded-md border border-[var(--color-border)] px-2 py-1 text-[10px] font-black uppercase text-[var(--color-brand-primary)]">{marketDifficulty(market)}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">{market.yes}c YES / {market.no}c NO</span>
                </div>
                <p className="mt-2 text-sm font-bold text-[var(--color-text-primary)]">{market.question}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={onStart} className="rounded-xl bg-[var(--color-brand-primary)] py-5 text-lg font-black text-white transition-all hover:bg-red-500 active:scale-[0.98]">
            {t("h2h.joinRanked")}
          </button>
          <button onClick={onGhost} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] py-4 text-sm font-bold text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-brand-primary)]/50">
            {t("h2h.practiceGhost")}
          </button>
          <Link href="/leagues" className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] py-4 text-center text-sm font-bold text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-brand-primary)]/50">
            {t("h2h.openRooms")}
          </Link>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4">
            <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("h2h.rivalryHistory")}</p>
            {history.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">{t("h2h.historyEmpty")}</p>
            ) : (
              <div className="mt-3 grid gap-2">
                {history.slice(0, 4).map((run) => (
                  <div key={run.date} className="flex items-center justify-between rounded-lg bg-[var(--color-surface-2)] px-3 py-2 text-sm">
                    <span className="font-bold text-[var(--color-text-primary)]">{run.date}</span>
                    <span className={run.result === "loss" ? "text-[var(--color-danger)]" : "text-[var(--color-success)]"}>{run.yourScore}-{run.opponentScore}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function PickingScreen({
  picks,
  qIdx,
  confidenceMarketId,
  mode,
  timer,
  feedback,
  onPick,
  onConfidence,
  onJump,
  onTrashTalk,
  onBack,
  onSubmit,
  submitting,
  error,
  t,
}: {
  picks: Pick[];
  qIdx: number;
  confidenceMarketId: string | null;
  mode: MatchMode;
  timer: number;
  feedback: string | null;
  onPick: (i: number, c: H2HPick) => void;
  onConfidence: (id: string) => void;
  onJump: (i: number) => void;
  onTrashTalk: (line: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
  t: ReturnType<typeof useI18n>["t"];
}) {
  const market = DAILY_MARKETS[qIdx]!;
  const allPicked = picks.every((p) => p !== null);
  const current = picks[qIdx];
  const modeLabel = mode === "ghost" ? t("h2h.ghost") : t("h2h.live");

  return (
    <div className="mx-auto flex max-w-lg flex-col px-4" style={{ height: "calc(100dvh - 80px)" }}>
      <div className="flex flex-shrink-0 items-center justify-between pt-4">
        <button onClick={onBack} className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]">
          {t("h2h.back")}
        </button>
        <span className="text-sm font-black text-[var(--color-text-muted)]">
          {t("h2h.duelTimer", { mode: modeLabel, timer: String(timer) })}
        </span>
      </div>

      <div className="mt-4 flex flex-shrink-0 gap-2">
        {DAILY_MARKETS.map((item, i) => (
          <button
            key={item.id}
            onClick={() => onJump(i)}
            className={`h-1.5 flex-1 rounded-full transition-colors ${picks[i] !== null ? "bg-[var(--color-brand-primary)]" : i === qIdx ? "bg-[var(--color-text-muted)]" : "bg-[var(--color-surface-3)]"}`}
            aria-label={t("h2h.marketAria", { number: String(i + 1) })}
          />
        ))}
      </div>

      <div className="flex flex-1 flex-col justify-center gap-5 py-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{market.sport}</span>
          <span className="rounded-md border border-[var(--color-border)] px-2 py-1 text-[10px] font-black uppercase text-[var(--color-text-muted)]">{marketDifficulty(market)}</span>
          {confidenceMarketId === market.id && <span className="rounded-md bg-[var(--color-brand-primary)] px-2 py-1 text-[10px] font-black uppercase text-white">{t("h2h.confidence2x")}</span>}
        </div>
        <h2 className="text-3xl font-display font-black leading-tight tracking-tight text-[var(--color-text-primary)]">{market.question}</h2>
        <div className="flex gap-4 text-sm text-[var(--color-text-muted)]">
          <span><span className="font-black text-[var(--color-success)]">{market.yes}c</span> YES</span>
          <span>-</span>
          <span><span className="font-black text-[var(--color-danger)]">{market.no}c</span> NO</span>
        </div>
        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{marketNote(market)}</p>
        {feedback && <p className="rounded-lg border border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/10 px-3 py-2 text-sm font-bold text-[var(--color-text-primary)]">{feedback}</p>}
      </div>

      <div className="flex flex-shrink-0 flex-col gap-3 pb-6">
        <button onClick={() => onPick(qIdx, "yes")} className={`w-full rounded-xl py-5 text-xl font-black transition-all active:scale-[0.97] ${current === "yes" ? "bg-[var(--color-success)] text-white ring-2 ring-[var(--color-success)]" : "bg-[var(--color-success-dim)] text-[var(--color-success)] hover:bg-[var(--color-success)] hover:text-white"}`}>
          YES {current === "yes" && "selected"}
        </button>
        <button onClick={() => onPick(qIdx, "no")} className={`w-full rounded-xl py-5 text-xl font-black transition-all active:scale-[0.97] ${current === "no" ? "bg-[var(--color-danger)] text-white ring-2 ring-[var(--color-danger)]" : "bg-[var(--color-danger-dim)] text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white"}`}>
          NO {current === "no" && "selected"}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => onConfidence(market.id)} className="rounded-xl border border-[var(--color-border)] py-3 text-sm font-bold text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-brand-primary)]/50">
            {confidenceMarketId === market.id ? t("h2h.confidenceLocked") : t("h2h.mark2x")}
          </button>
          <button onClick={() => onTrashTalk("Pressure is on.")} className="rounded-xl border border-[var(--color-border)] py-3 text-sm font-bold text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-brand-primary)]/50">
            Quick taunt
          </button>
        </div>
        {allPicked && (
          <button onClick={onSubmit} disabled={submitting} className="mt-1 w-full rounded-xl bg-[var(--color-brand-primary)] py-4 text-base font-black text-white transition-all hover:bg-red-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? t("h2h.saving") : mode === "ghost" ? t("h2h.revealGhost") : t("h2h.lockPicks")}
          </button>
        )}
        {error && <p className="rounded-lg border border-[var(--color-danger)]/30 px-3 py-2 text-xs text-[var(--color-danger)]">{error}</p>}
      </div>
    </div>
  );
}

function LockedScreen({ picks, opponentPicks, trashTalk, onReveal, t }: { picks: Pick[]; opponentPicks: Record<string, H2HPick>; trashTalk: string | null; onReveal: () => void; t: ReturnType<typeof useI18n>["t"] }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-8">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("h2h.lockstepReveal")}</p>
        <h1 className="text-3xl font-display font-black tracking-tight">{t("h2h.picksLockedPrivately")}</h1>
        {trashTalk && <p className="mt-2 text-sm font-bold text-[var(--color-text-secondary)]">{trashTalk}</p>}
      </div>
      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)]">
        <div className="grid grid-cols-[1fr_72px_72px] border-b border-[var(--color-border)] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">
          <span>{t("h2h.market")}</span>
          <span className="text-center">{t("h2h.you")}</span>
          <span className="text-center">{OPPONENT.emoji}</span>
        </div>
        {DAILY_MARKETS.map((market, index) => {
          const yours = picks[index];
          const theirs = opponentPicks[market.id]!;
          return (
            <div key={market.id} className="grid grid-cols-[1fr_72px_72px] items-center border-b border-[var(--color-border)] px-4 py-3 last:border-0">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase text-[var(--color-brand-primary)]">{market.sport}</p>
                <p className="truncate text-sm text-[var(--color-text-primary)]">{market.question}</p>
              </div>
              <span className={`text-center text-sm font-black ${yours === "yes" ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>{yours?.toUpperCase()}</span>
              <span className="text-center text-sm font-black text-[var(--color-text-muted)]">{theirs.toUpperCase()}</span>
            </div>
          );
        })}
      </div>
      <button onClick={onReveal} className="w-full rounded-xl bg-[var(--color-brand-primary)] py-4 text-base font-black text-white transition-all hover:bg-red-500 active:scale-[0.98]">
        {t("h2h.revealResults")}
      </button>
    </div>
  );
}

function ResultsScreen({
  run,
  leaderboard,
  leaderboardLoading,
  leaderboardError,
  userId,
  mode,
  shareStatus,
  onShare,
  onChallenge,
  onRematch,
  t,
}: {
  run: H2HRun;
  leaderboard: H2HLeaderboardEntry[];
  leaderboardLoading: boolean;
  leaderboardError: string | null;
  userId: string | null;
  mode: MatchMode;
  shareStatus: string | null;
  onShare: (run: H2HRun) => void;
  onChallenge: (run: H2HRun) => void;
  onRematch: () => void;
  t: ReturnType<typeof useI18n>["t"];
}) {
  const youWin = run.result !== "loss";
  const bestIndex = DAILY_MARKETS.findIndex((market, index) => run.picks[index] === run.outcomes[market.id] && (run.picks[index] === (market.yes <= market.no ? "yes" : "no") || market.id === run.confidenceMarketId));
  const worstIndex = DAILY_MARKETS.findIndex((market, index) => run.picks[index] !== run.outcomes[market.id]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-8 pb-24">
      <section className={`rounded-xl border p-6 text-center ${youWin ? "border-[var(--color-success)] bg-[var(--color-success-dim)]" : "border-[var(--color-danger)] bg-[var(--color-danger-dim)]"}`}>
        <p className="text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)]">{mode === "ghost" ? t("h2h.ghostResult") : t("h2h.rankedResult")}</p>
        <h1 className="mt-2 text-4xl font-display font-black tracking-tight">{run.result === "tie-win" ? t("h2h.tieBreakWin") : youWin ? t("h2h.youWin") : t("h2h.opponentWins", { name: OPPONENT.name })}</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          {t("h2h.scoreLineWithCorrect", { yourScore: String(run.yourScore), opponentScore: String(run.opponentScore), name: OPPONENT.name, correct: String(run.yourCorrect), total: String(DAILY_MARKETS.length) })}
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5">
          <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("h2h.matchRecap")}</p>
          <div className="mt-4 rounded-xl bg-[var(--color-surface-2)] p-5">
            <p className="text-sm font-black text-[var(--color-text-primary)]">{dailyRoomName()}</p>
            <p className="mt-2 text-4xl font-display font-black text-[var(--color-brand-primary)]">{run.yourScore}-{run.opponentScore}</p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{run.result === "loss" ? t("h2h.rivalHeld") : t("h2h.youTookDuel")}</p>
            <p className="mt-4 text-xs text-[var(--color-text-muted)]">{t("h2h.best")}: {bestIndex >= 0 ? DAILY_MARKETS[bestIndex]!.question : t("h2h.cleanFundamentals")}</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">{t("h2h.study")}: {worstIndex >= 0 ? DAILY_MARKETS[worstIndex]!.question : t("h2h.noMissedMarkets")}</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatPill label="Upset hits" value={run.upsetHits} />
            <StatPill label="Rating move" value={run.result === "loss" ? "-18" : run.result === "tie-win" ? "+8" : "+24"} />
            <StatPill label={t("h2h.confidence")} value={run.confidenceMarketId ? t("h2h.used") : t("h2h.none")} />
            <StatPill label="Margin" value={run.yourScore - run.opponentScore} />
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5">
          <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("h2h.pickSwing")}</p>
          <div className="mt-4 flex h-28 items-end gap-2">
            {run.swing.map((value, index) => {
              const height = 36 + Math.min(54, Math.abs(value) * 18);
              return (
                <div key={`${value}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                  <div className={`w-full rounded-t-md ${value >= 0 ? "bg-[var(--color-success)]" : "bg-[var(--color-danger)]"}`} style={{ height }} />
                  <span className="text-[10px] font-black text-[var(--color-text-muted)]">M{index + 1}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
            {t("h2h.swingBody", { name: OPPONENT.name })}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)]">
        <div className="grid grid-cols-[1fr_54px_54px_54px] border-b border-[var(--color-border)] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">
          <span>{t("h2h.postMatchBreakdown")}</span>
          <span className="text-center">{t("h2h.result")}</span>
          <span className="text-center">{t("h2h.you")}</span>
          <span className="text-center">{OPPONENT.emoji}</span>
        </div>
        {DAILY_MARKETS.map((market, index) => {
          const outcome = run.outcomes[market.id]!;
          const yours = run.picks[index]!;
          const theirs = run.opponentPicks[market.id]!;
          const youGot = yours === outcome;
          const theyGot = theirs === outcome;
          return (
            <div key={market.id} className="grid grid-cols-[1fr_54px_54px_54px] items-center border-b border-[var(--color-border)] px-4 py-3 last:border-0">
              <div className="min-w-0 pr-2">
                <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{market.question}</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">{marketNote(market)}</p>
              </div>
              <span className="text-center text-xs font-black text-[var(--color-text-muted)]">{outcome.toUpperCase()}</span>
              <span className={`text-center text-sm font-black ${youGot ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>{youGot ? "Y" : "N"}</span>
              <span className={`text-center text-sm font-black ${theyGot ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>{theyGot ? "Y" : "N"}</span>
            </div>
          );
        })}
      </section>

      <H2HLeaderboard entries={leaderboard} userId={userId} loading={leaderboardLoading} error={leaderboardError} t={t} />

      <div className="grid gap-3 sm:grid-cols-4">
        <button onClick={() => onShare(run)} className="rounded-xl bg-[var(--color-surface-2)] py-4 text-base font-black text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-surface-3)] active:scale-[0.98]">
          {t("h2h.shareResult")}
        </button>
        <button onClick={() => onChallenge(run)} className="rounded-xl bg-[var(--color-brand-primary)] py-4 text-base font-black text-white transition-all hover:bg-red-500 active:scale-[0.98]">
          {t("h2h.copyChallenge")}
        </button>
        <button onClick={onRematch} className="rounded-xl border border-[var(--color-border)] py-4 text-sm font-bold text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-brand-primary)]/50">
          {t("h2h.runItBack")}
        </button>
        <Link href="/card" className="rounded-xl border border-[var(--color-border)] py-4 text-center text-sm font-bold text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-brand-primary)]/50">
          {t("h2h.fullCard")}
        </Link>
      </div>
      {shareStatus && <p className="text-center text-xs font-semibold text-[var(--color-success)]">{shareStatus}</p>}
    </div>
  );
}

function H2HLeaderboard({ entries, userId, loading, error, t }: { entries: H2HLeaderboardEntry[]; userId: string | null; loading: boolean; error: string | null; t: ReturnType<typeof useI18n>["t"] }) {
  const [filter, setFilter] = useState<BoardFilter>("today");
  const filtered = entries.filter((entry) => {
    const isPreview = entry.uid.startsWith("mock-h2h-");
    if (filter === "friends") return userId ? entry.uid === userId : false;
    if (filter === "verified") return !isPreview;
    if (filter === "wins") return entry.result !== "loss";
    if (filter === "upsets") return entry.upsetHits > 0;
    return true;
  });

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)]">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("h2h.board")}</p>
        <Link href="/leaderboard" className="text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">{t("h2h.allBoards")}</Link>
      </div>
      <div className="flex gap-2 overflow-x-auto border-b border-[var(--color-border)] px-4 py-3">
        {(["today", "week", "friends", "verified", "wins", "upsets"] as BoardFilter[]).map((item) => (
          <button key={item} onClick={() => setFilter(item)} className={`rounded-lg px-3 py-1.5 text-xs font-black uppercase transition-all ${filter === item ? "bg-[var(--color-brand-primary)] text-white" : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"}`}>
            {item}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm font-black text-[var(--color-text-primary)]">{t("h2h.loadingDuels")}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{t("h2h.verifiedOnly")}</p>
        </div>
      ) : error ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm font-black text-[var(--color-text-primary)]">{t("h2h.loadBoardError")}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm font-black text-[var(--color-text-primary)]">{t("h2h.noRankedDuels")}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{filter === "today" || filter === "verified" ? t("h2h.firstVerified") : t("h2h.noFilterMatches")}</p>
        </div>
      ) : (
        filtered.slice(0, 8).map((entry, index) => {
          const isYou = userId === entry.uid;
          const label = entry.result === "tie-win" ? t("h2h.tieWin") : entry.result === "win" ? t("h2h.win") : t("h2h.loss");
          const labelColor = entry.result === "loss" ? "text-[var(--color-danger)]" : "text-[var(--color-success)]";
          const isPreview = entry.uid.startsWith("mock-h2h-");
          const name = entry.username ? (
            <Link href={`/profile?u=${encodeURIComponent(entry.username)}`} className="hover:text-[var(--color-brand-primary)]">{entry.displayName}</Link>
          ) : entry.displayName;
          return (
            <div key={entry.uid} className={`grid grid-cols-[28px_32px_1fr_64px_64px] items-center gap-2 border-b border-[var(--color-border)] px-4 py-3 last:border-0 ${isYou ? "bg-[var(--color-brand-primary)]/10" : ""}`}>
              <span className="text-right text-xs font-black text-[var(--color-text-muted)]">{index + 1}</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-3)] text-xs font-black text-[var(--color-brand-primary)]">
                {entry.displayName.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className={`truncate text-sm font-bold ${isYou ? "text-[var(--color-brand-primary)]" : "text-[var(--color-text-primary)]"}`}>{name}{isYou ? t("h2h.youSuffix") : ""}</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">
                  {isPreview ? t("h2h.previewRow") : t("h2h.correctUpsets", { correct: String(entry.yourCorrect), opponentCorrect: String(entry.opponentCorrect), upsets: String(entry.upsetHits) })}
                </p>
              </div>
              <span className="text-right text-sm font-black text-[var(--color-text-primary)]">{entry.yourScore}-{entry.opponentScore}</span>
              <span className={`text-right text-xs font-black ${labelColor}`}>{label}</span>
            </div>
          );
        })
      )}
    </div>
  );
}

export function H2HClient() {
  const { user, verificationRequired } = useAuth();
  const { t } = useI18n();
  const [phase, setPhase] = useState<"intro" | "picking" | "locked" | "results">("intro");
  const [mode, setMode] = useState<MatchMode>("ranked");
  const [picks, setPicks] = useState<Pick[]>(Array(DAILY_MARKETS.length).fill(null));
  const [qIdx, setQIdx] = useState(0);
  const [confidenceMarketId, setConfidenceMarketId] = useState<string | null>(null);
  const [savedRun, setSavedRun] = useState<H2HRun | null>(null);
  const [activeRun, setActiveRun] = useState<H2HRun | null>(null);
  const [history, setHistory] = useState<H2HRun[]>([]);
  const [signInOpen, setSignInOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<H2HLeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [timer, setTimer] = useState(90);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [trashTalk, setTrashTalk] = useState<string | null>(null);
  const [challengeScore, setChallengeScore] = useState<string | null>(null);

  useEffect(() => {
    const local = loadSavedRun();
    setHistory(loadHistory());
    if (typeof window !== "undefined") {
      setChallengeScore(new URLSearchParams(window.location.search).get("challenge"));
    }
    if (!local) return;
    setSavedRun(local);
    setPicks(local.picks);
    setConfidenceMarketId(local.confidenceMarketId ?? null);
  }, []);

  useEffect(() => subscribeH2HLeaderboard(h2hDateId(), (entries) => {
    setLeaderboard(entries);
    setLeaderboardLoading(false);
    setLeaderboardError(null);
  }, () => {
    setLeaderboardLoading(false);
    setLeaderboardError("Refresh the page or try again after today's first ranked matches land.");
  }), []);

  useEffect(() => {
    if (phase !== "picking") return;
    setTimer(90);
    const id = window.setInterval(() => setTimer((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (!user || verificationRequired) return;
    getStoredH2HRun(user.uid)
      .then((run) => {
        if (!run) return;
        persistRun(run);
        setSavedRun(run);
        setPicks(run.picks);
        setConfidenceMarketId(run.confidenceMarketId ?? null);
        setHistory(loadHistory());
      })
      .catch(() => setSaveError("Could not load today's Head-to-Head result."));
  }, [user, verificationRequired]);

  function handlePick(i: number, choice: H2HPick) {
    const next = [...picks];
    next[i] = choice;
    setPicks(next);
    const market = DAILY_MARKETS[i]!;
    const lowerSide = market.yes <= market.no ? "YES" : "NO";
    setFeedback(`${choice.toUpperCase()} locked. ${choice.toUpperCase() === lowerSide ? "Upset lane open." : "Favorite lane covered."}`);
    window.setTimeout(() => setFeedback(null), 900);
    const nextUnpicked = next.findIndex((pick, index) => index > i && pick === null);
    setQIdx(nextUnpicked !== -1 ? nextUnpicked : i);
  }

  function startGame(nextMode: MatchMode) {
    if (nextMode === "ranked" && !user) {
      setSignInOpen(true);
      return;
    }
    if (nextMode === "ranked" && (verificationRequired || savedRun)) return;
    setMode(nextMode);
    setSaveError(null);
    setShareStatus(null);
    setTrashTalk(null);
    setActiveRun(null);
    setPicks(Array(DAILY_MARKETS.length).fill(null));
    setConfidenceMarketId(null);
    setQIdx(0);
    setPhase("picking");
  }

  async function submitPicks() {
    if (!picks.every((pick): pick is H2HPick => pick === "yes" || pick === "no")) return;
    if (mode === "ranked" && !user) {
      setSignInOpen(true);
      return;
    }
    if (mode === "ranked" && (verificationRequired || saving)) return;
    setSaving(true);
    setSaveError(null);
    const lockedPicks = picks;
    const localRun = buildLocalRun(lockedPicks, confidenceMarketId);
    setActiveRun(localRun);
    if (mode === "ghost") {
      setPhase("locked");
      setSaving(false);
      return;
    }
    persistRun(localRun);
    setSavedRun(localRun);
    try {
      const run = await saveH2HRun(user!.uid, lockedPicks, {
        displayName: user!.displayName || user!.email?.split("@")[0] || "You",
        photoURL: user!.photoURL,
      }, h2hDateId(), confidenceMarketId);
      persistRun(run);
      setSavedRun(run);
      setActiveRun(run);
      setPicks(run.picks);
      setHistory(loadHistory());
      setPhase("locked");
    } catch {
      setPicks(localRun.picks);
      setPhase("locked");
      setSaveError("Your match is saved locally, but could not sync to your account.");
    } finally {
      setSaving(false);
    }
  }

  async function shareResult(run: H2HRun) {
    const text = shareText(run);
    const url = typeof window !== "undefined" ? `${window.location.origin}/h2h` : "https://thecard.bet/h2h";
    setShareStatus(null);
    try {
      if (navigator.share) {
        await navigator.share({ title: "The Card Head-to-Head", text, url });
        setShareStatus("Shared.");
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setShareStatus("Copied to clipboard.");
    } catch {
      setShareStatus("Share canceled.");
    }
  }

  async function copyChallenge(run: H2HRun) {
    const url = typeof window !== "undefined" ? `${window.location.origin}/h2h?challenge=${run.yourScore}` : `https://thecard.bet/h2h?challenge=${run.yourScore}`;
    await navigator.clipboard.writeText(`Beat my ${run.yourScore}-point H2H score on The Card: ${url}`);
    setShareStatus("Challenge link copied.");
  }

  if (phase === "intro") {
    return (
      <>
        <ScoutFloaters page="h2h" />
        <IntroScreen savedRun={savedRun} history={history} challengeScore={challengeScore} t={t} onStart={() => startGame("ranked")} onGhost={() => startGame("ghost")} onViewResults={() => {
          if (!savedRun) return;
          setActiveRun(savedRun);
          setPicks(savedRun.picks);
          setConfidenceMarketId(savedRun.confidenceMarketId ?? null);
          setMode("ranked");
          setPhase("results");
        }} />
        <div className="mx-auto max-w-lg px-4 pb-24">
          {!user && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4 text-center">
              <p className="text-sm font-bold text-[var(--color-text-primary)]">{t("h2h.signInTitle")}</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">{t("h2h.signInBody")}</p>
              <button onClick={() => setSignInOpen(true)} className="mt-3 rounded-lg bg-[var(--color-brand-primary)] px-4 py-2 text-xs font-bold text-white">
                {t("account.signIn")}
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

  if (phase === "picking") {
    return (
      <>
        <ScoutFloaters page="h2h" />
        <PickingScreen
          picks={picks}
          qIdx={qIdx}
          confidenceMarketId={confidenceMarketId}
          mode={mode}
          timer={timer}
          feedback={feedback}
          onPick={handlePick}
          onConfidence={(id) => setConfidenceMarketId((current) => current === id ? null : id)}
          onJump={setQIdx}
          onTrashTalk={setTrashTalk}
          onBack={() => setPhase("intro")}
          onSubmit={submitPicks}
          submitting={saving}
          error={saveError}
          t={t}
        />
      </>
    );
  }

  if (phase === "locked") {
    const run = activeRun ?? buildLocalRun(picks.filter((pick): pick is H2HPick => pick !== null), confidenceMarketId);
    return (
      <>
        <ScoutFloaters page="h2h" />
        <LockedScreen picks={run.picks} opponentPicks={run.opponentPicks} trashTalk={trashTalk} onReveal={() => setPhase("results")} t={t} />
      </>
    );
  }

  const run = activeRun ?? savedRun ?? buildLocalRun(picks.filter((pick): pick is H2HPick => pick !== null), confidenceMarketId);
  return (
    <>
      <ScoutFloaters page="h2h" />
      <ResultsScreen
        run={run}
        leaderboard={leaderboard}
        leaderboardLoading={leaderboardLoading}
        leaderboardError={leaderboardError}
        userId={user?.uid ?? null}
        mode={mode}
        shareStatus={shareStatus}
        onShare={shareResult}
        onChallenge={copyChallenge}
        onRematch={() => startGame("ghost")}
        t={t}
      />
    </>
  );
}
