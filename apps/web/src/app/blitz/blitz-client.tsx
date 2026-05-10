"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { DAILY_MARKETS, getDailyOutcomes } from "@/lib/daily-markets";
import type { DailyMarket } from "@/lib/daily-markets";

const SECS = 15;
const STORAGE_KEY = "blitz_v1";

type Pick = "yes" | "no" | "skip";

interface SavedGame {
  date: string;
  picks: Pick[];
  times: number[];
}

function todayStr() {
  return new Date().toDateString();
}

function loadSaved(): SavedGame | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const g = JSON.parse(raw) as SavedGame;
    return g.date === todayStr() ? g : null;
  } catch {
    return null;
  }
}

function persist(picks: Pick[], times: number[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayStr(), picks, times }));
}

function pts(pick: Pick, outcome: "yes" | "no", timeSec: number): number {
  if (pick === "skip" || pick !== outcome) return 0;
  return timeSec <= 5 ? 2 : 1;
}

function timeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const ms = midnight.getTime() - now.getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

// ── Sub-screens ───────────────────────────────────────────────────────────────

function IntroScreen({
  saved,
  onStart,
  onViewResults,
}: {
  saved: SavedGame | null;
  onStart: () => void;
  onViewResults: () => void;
}) {
  const outcomes = getDailyOutcomes();

  if (saved) {
    const correct = saved.picks.filter(
      (p, i) => p !== "skip" && p === outcomes[DAILY_MARKETS[i].id]
    ).length;
    const total = saved.picks.reduce(
      (sum, p, i) => sum + pts(p, outcomes[DAILY_MARKETS[i].id], saved.times[i]),
      0
    );

    return (
      <div className="max-w-lg mx-auto px-4 py-12 flex flex-col gap-8 items-center text-center">
        <div className="text-6xl">⚡</div>
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-display font-black tracking-tight">BLITZ</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Already played today.</p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-6 w-full flex flex-col items-center gap-1">
          <span className="text-6xl font-display font-black text-[var(--color-brand-primary)]">
            {total}
          </span>
          <span className="text-sm text-[var(--color-text-muted)]">
            points · {correct}/{DAILY_MARKETS.length} correct
          </span>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onViewResults}
            className="w-full py-4 rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-base hover:bg-red-500 transition-all active:scale-[0.98]"
          >
            See Breakdown
          </button>
          <Link
            href="/h2h"
            className="w-full py-4 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold text-sm text-center hover:border-[var(--color-brand-primary)]/50 transition-all"
          >
            🥊 Challenge a Friend
          </Link>
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">Next card in {timeUntilMidnight()}</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12 flex flex-col gap-8 items-center text-center">
      <div className="text-7xl leading-none">⚡</div>
      <div className="flex flex-col gap-3">
        <h1 className="text-5xl font-display font-black tracking-tight">BLITZ</h1>
        <p className="text-[var(--color-text-secondary)] text-base leading-relaxed max-w-xs mx-auto">
          5 markets. 15 seconds each.<br />No second-guessing.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5 w-full text-left flex flex-col gap-3">
        <p className="text-[10px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest">
          Scoring
        </p>
        <div className="flex flex-col gap-2">
          {[
            ["Correct in under 5s", "+2 pts", "var(--color-success)"],
            ["Correct in 5–15s", "+1 pt", "var(--color-success)"],
            ["Wrong or timed out", "0 pts", "var(--color-text-muted)"],
          ].map(([label, score, color]) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">{label}</span>
              <span className="font-black" style={{ color }}>{score}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onStart}
        className="w-full py-5 rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-lg hover:bg-red-500 transition-all hover:shadow-[0_0_24px_rgba(255,60,60,0.4)] active:scale-[0.98]"
      >
        Play →
      </button>
      <p className="text-xs text-[var(--color-text-muted)]">Today&apos;s card resets at midnight.</p>
    </div>
  );
}

function PlayingScreen({
  market,
  qIdx,
  total,
  timeLeft,
  flash,
  onPick,
}: {
  market: DailyMarket;
  qIdx: number;
  total: number;
  timeLeft: number;
  flash: "yes" | "no" | null;
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
    <div className="max-w-lg mx-auto px-4 flex flex-col" style={{ height: "calc(100dvh - 80px)" }}>
      {/* Timer bar */}
      <div className="h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden mt-4 flex-shrink-0">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: timerColor, transition: "width 0.1s linear, background 0.5s" }}
        />
      </div>

      {/* Progress dots + timer */}
      <div className="flex items-center justify-between mt-4 flex-shrink-0">
        <div className="flex gap-2">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i < qIdx
                  ? "bg-[var(--color-text-muted)]"
                  : i === qIdx
                  ? "bg-[var(--color-brand-primary)]"
                  : "bg-[var(--color-surface-3)]"
              }`}
            />
          ))}
        </div>
        <span
          className="text-sm font-black tabular-nums"
          style={{ color: timerColor }}
        >
          {Math.ceil(timeLeft)}s
        </span>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col justify-center gap-5 py-6">
        <span className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest">
          {market.sport}
        </span>
        <h2 className="text-3xl font-display font-black tracking-tight leading-tight text-[var(--color-text-primary)]">
          {market.question}
        </h2>
        <div className="flex gap-4 text-sm text-[var(--color-text-muted)]">
          <span>
            <span className="font-black text-[var(--color-success)]">{market.yes}¢</span> YES
          </span>
          <span>·</span>
          <span>
            <span className="font-black text-[var(--color-danger)]">{market.no}¢</span> NO
          </span>
        </div>
      </div>

      {/* Pick buttons */}
      <div className="flex flex-col gap-3 pb-6 flex-shrink-0">
        <button
          onClick={() => onPick("yes")}
          className={`w-full py-6 rounded-xl font-black text-2xl transition-all active:scale-[0.97] ${
            flash === "yes"
              ? "bg-[var(--color-success)] text-white"
              : "bg-[var(--color-success-dim)] text-[var(--color-success)] hover:bg-[var(--color-success)] hover:text-white"
          }`}
        >
          YES
        </button>
        <button
          onClick={() => onPick("no")}
          className={`w-full py-6 rounded-xl font-black text-2xl transition-all active:scale-[0.97] ${
            flash === "no"
              ? "bg-[var(--color-danger)] text-white"
              : "bg-[var(--color-danger-dim)] text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white"
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
}: {
  picks: Pick[];
  times: number[];
  outcomes: Record<string, "yes" | "no">;
}) {
  const correct = picks.filter(
    (p, i) => p !== "skip" && p === outcomes[DAILY_MARKETS[i].id]
  ).length;
  const totalPts = picks.reduce(
    (sum, p, i) => sum + pts(p, outcomes[DAILY_MARKETS[i].id], times[i]),
    0
  );
  const maxPts = DAILY_MARKETS.length * 2;
  const validTimes = times.filter((_, i) => picks[i] !== "skip");
  const avgTime =
    validTimes.length > 0
      ? Math.round((validTimes.reduce((a, b) => a + b, 0) / validTimes.length) * 10) / 10
      : 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest">
          ⚡ Blitz Results
        </p>
        <div className="flex items-end gap-2">
          <span className="text-7xl font-display font-black text-[var(--color-text-primary)]">
            {totalPts}
          </span>
          <span className="text-xl text-[var(--color-text-muted)] pb-2">/ {maxPts} pts</span>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {correct}/{DAILY_MARKETS.length} correct
          {avgTime > 0 && ` · avg ${avgTime}s per pick`}
        </p>
      </div>

      {/* Market breakdown */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] overflow-hidden">
        {DAILY_MARKETS.map((m, i) => {
          const p = picks[i];
          const outcome = outcomes[m.id];
          const isCorrect = p !== "skip" && p === outcome;
          const isSkip = p === "skip";
          const earned = pts(p, outcome, times[i]);

          return (
            <div
              key={m.id}
              className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] last:border-0"
            >
              <span
                className={`text-lg font-black w-5 shrink-0 ${
                  isCorrect ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
                }`}
              >
                {isSkip ? "—" : isCorrect ? "✓" : "✗"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                  {m.question}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {isSkip ? "Timed out" : `You: ${p.toUpperCase()}`}
                  {" · "}
                  Correct: {outcome.toUpperCase()}
                </p>
              </div>
              <span
                className={`text-sm font-black shrink-0 ${
                  earned > 0 ? "text-[var(--color-success)]" : "text-[var(--color-text-muted)]"
                }`}
              >
                {earned > 0 ? `+${earned}` : "0"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/h2h"
          className="w-full py-4 rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-base text-center hover:bg-red-500 transition-all hover:shadow-[0_0_24px_rgba(255,60,60,0.4)] active:scale-[0.98]"
        >
          🥊 Challenge a Friend
        </Link>
        <Link
          href="/card"
          className="w-full py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold text-sm text-center hover:border-[var(--color-brand-primary)]/50 transition-all"
        >
          Tonight&apos;s Card
        </Link>
      </div>

      <p className="text-xs text-[var(--color-text-muted)] text-center">
        Next card in {timeUntilMidnight()}
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function BlitzClient() {
  const outcomes = getDailyOutcomes();

  const [phase, setPhase] = useState<"intro" | "playing" | "done">("intro");
  const [qIdx, setQIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(SECS);
  const [flash, setFlash] = useState<"yes" | "no" | null>(null);
  const [saved, setSaved] = useState<SavedGame | null>(null);

  // Accumulate picks in a ref to avoid stale-closure issues in the timer
  const gameRef = useRef<{ picks: Pick[]; times: number[] }>({ picks: [], times: [] });
  const lockedRef = useRef(false);
  const qStartRef = useRef(Date.now());

  // Final picks/times as state so ResultsScreen re-renders correctly
  const [finalPicks, setFinalPicks] = useState<Pick[]>([]);
  const [finalTimes, setFinalTimes] = useState<number[]>([]);

  useEffect(() => {
    setSaved(loadSaved());
  }, []);

  const finishQuestion = useCallback((choice: Pick) => {
    if (lockedRef.current) return;
    lockedRef.current = true;

    const elapsed = Math.min(SECS, Math.round((Date.now() - qStartRef.current) / 1000));
    gameRef.current.picks.push(choice);
    gameRef.current.times.push(elapsed);

    if (choice !== "skip") setFlash(choice);

    const nextIdx = gameRef.current.picks.length;
    const done = nextIdx >= DAILY_MARKETS.length;

    setTimeout(() => {
      setFlash(null);
      if (done) {
        const { picks, times } = gameRef.current;
        persist(picks, times);
        const saved: SavedGame = { date: todayStr(), picks, times };
        setSaved(saved);
        setFinalPicks([...picks]);
        setFinalTimes([...times]);
        setPhase("done");
      } else {
        lockedRef.current = false;
        setQIdx(nextIdx);
        setTimeLeft(SECS);
        qStartRef.current = Date.now();
      }
    }, choice === "skip" ? 50 : 500);
  }, []);

  // Smooth 100ms timer — restarts per question via qIdx dependency
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

  function startGame() {
    gameRef.current = { picks: [], times: [] };
    lockedRef.current = false;
    setQIdx(0);
    setTimeLeft(SECS);
    setFlash(null);
    setPhase("playing");
  }

  if (phase === "intro") {
    return (
      <IntroScreen
        saved={saved}
        onStart={startGame}
        onViewResults={() => {
          if (!saved) return;
          setFinalPicks(saved.picks);
          setFinalTimes(saved.times);
          setPhase("done");
        }}
      />
    );
  }

  if (phase === "playing") {
    return (
      <PlayingScreen
        market={DAILY_MARKETS[qIdx]}
        qIdx={qIdx}
        total={DAILY_MARKETS.length}
        timeLeft={timeLeft}
        flash={flash}
        onPick={(c) => finishQuestion(c)}
      />
    );
  }

  return (
    <ResultsScreen picks={finalPicks} times={finalTimes} outcomes={outcomes} />
  );
}
