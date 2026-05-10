"use client";

import { useState } from "react";
import Link from "next/link";
import { DAILY_MARKETS, getDailyOutcomes, getOpponentPicks } from "@/lib/daily-markets";

type Pick = "yes" | "no" | null;

const OPPONENT = {
  name: "MarketMike",
  emoji: "🦊",
  record: "12W – 4L",
  winPct: 75,
};

// ── Sub-screens ───────────────────────────────────────────────────────────────

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-12 flex flex-col gap-8 items-center text-center">
      <div className="text-6xl">🥊</div>
      <div className="flex flex-col gap-3">
        <h1 className="text-5xl font-display font-black tracking-tight">Head&#x2011;to&#x2011;Head</h1>
        <p className="text-[var(--color-text-secondary)] text-base leading-relaxed max-w-xs mx-auto">
          You vs the market. Same 5 markets, no timer.
          Most right wins.
        </p>
      </div>

      {/* Matchup card */}
      <div className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5 flex items-center gap-4">
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-3xl">🧑‍💻</span>
          <span className="text-sm font-black text-[var(--color-text-primary)]">You</span>
          <span className="text-xs text-[var(--color-text-muted)]">challenger</span>
        </div>
        <span className="text-2xl font-display font-black text-[var(--color-text-muted)]">vs</span>
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-3xl">{OPPONENT.emoji}</span>
          <span className="text-sm font-black text-[var(--color-text-primary)]">{OPPONENT.name}</span>
          <span className="text-xs text-[var(--color-text-muted)]">
            {OPPONENT.record} · {OPPONENT.winPct}%
          </span>
        </div>
      </div>

      <div className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4 text-left flex flex-col gap-2">
        <p className="text-[10px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest mb-1">
          How it works
        </p>
        {[
          "Pick YES or NO on each of 5 markets",
          "MarketMike picks independently",
          "Most correct picks wins",
          "Tie goes to the challenger (you)",
        ].map((line) => (
          <div key={line} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
            <span className="text-[var(--color-brand-primary)] font-bold shrink-0">→</span>
            <span>{line}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onStart}
        className="w-full py-5 rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-lg hover:bg-red-500 transition-all hover:shadow-[0_0_24px_rgba(255,60,60,0.4)] active:scale-[0.98]"
      >
        Make Your Picks →
      </button>
    </div>
  );
}

function PickingScreen({
  picks,
  qIdx,
  onPick,
  onBack,
  onSubmit,
}: {
  picks: Pick[];
  qIdx: number;
  onPick: (i: number, c: "yes" | "no") => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const market = DAILY_MARKETS[qIdx]!;
  const allPicked = picks.every((p) => p !== null);
  const current = picks[qIdx];

  return (
    <div className="max-w-lg mx-auto px-4 flex flex-col" style={{ height: "calc(100dvh - 80px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between pt-4 flex-shrink-0">
        <button
          onClick={onBack}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          ← Back
        </button>
        <span className="text-sm font-black text-[var(--color-text-muted)]">
          {qIdx + 1} of {DAILY_MARKETS.length}
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mt-4 flex-shrink-0">
        {DAILY_MARKETS.map((_, i) => (
          <button
            key={i}
            onClick={() => onPick(i, picks[i] ?? "yes")} // jump to question
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              picks[i] !== null
                ? "bg-[var(--color-brand-primary)]"
                : i === qIdx
                ? "bg-[var(--color-text-muted)]"
                : "bg-[var(--color-surface-3)]"
            }`}
          />
        ))}
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
          onClick={() => {
            onPick(qIdx, "yes");
            if (qIdx < DAILY_MARKETS.length - 1) {
              // parent handles advancing
            }
          }}
          className={`w-full py-5 rounded-xl font-black text-xl transition-all active:scale-[0.97] ${
            current === "yes"
              ? "bg-[var(--color-success)] text-white ring-2 ring-[var(--color-success)]"
              : "bg-[var(--color-success-dim)] text-[var(--color-success)] hover:bg-[var(--color-success)] hover:text-white"
          }`}
        >
          YES {current === "yes" && "✓"}
        </button>
        <button
          onClick={() => {
            onPick(qIdx, "no");
          }}
          className={`w-full py-5 rounded-xl font-black text-xl transition-all active:scale-[0.97] ${
            current === "no"
              ? "bg-[var(--color-danger)] text-white ring-2 ring-[var(--color-danger)]"
              : "bg-[var(--color-danger-dim)] text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white"
          }`}
        >
          NO {current === "no" && "✓"}
        </button>

        {allPicked && (
          <button
            onClick={onSubmit}
            className="w-full py-4 rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-base hover:bg-red-500 transition-all hover:shadow-[0_0_24px_rgba(255,60,60,0.4)] active:scale-[0.98] mt-1"
          >
            Lock In Picks →
          </button>
        )}
      </div>
    </div>
  );
}

function LockedScreen({
  picks,
  opponentPicks,
  onReveal,
}: {
  picks: Pick[];
  opponentPicks: Record<string, "yes" | "no">;
  onReveal: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest">
          🥊 Picks Locked
        </p>
        <h1 className="text-3xl font-display font-black tracking-tight">
          You vs {OPPONENT.name}
        </h1>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_80px_80px] px-4 py-2 border-b border-[var(--color-border)] text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-wider">
          <span>Market</span>
          <span className="text-center">You</span>
          <span className="text-center">{OPPONENT.emoji}</span>
        </div>

        {DAILY_MARKETS.map((m, i) => {
          const yours = picks[i];
          const theirs = opponentPicks[m.id]!;
          const diff = yours !== theirs;

          return (
            <div
              key={m.id}
              className="grid grid-cols-[1fr_80px_80px] px-4 py-3 border-b border-[var(--color-border)] last:border-0 items-center"
            >
              <div className="min-w-0">
                <p className="text-xs font-black text-[var(--color-brand-primary)] uppercase">{m.sport}</p>
                <p className="text-sm text-[var(--color-text-primary)] truncate leading-snug">{m.question}</p>
              </div>
              <span
                className={`text-center text-sm font-black ${
                  yours === "yes" ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
                }`}
              >
                {yours?.toUpperCase()}
              </span>
              <span
                className={`text-center text-sm font-black ${
                  diff ? "text-[var(--color-warning)]" : "text-[var(--color-text-muted)]"
                }`}
              >
                {theirs.toUpperCase()}
                {diff && " ⚡"}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
        {DAILY_MARKETS.filter((m, i) => picks[i] !== opponentPicks[m.id]).length} markets where you disagree with {OPPONENT.name}.
        Who&apos;s right?
      </p>

      <button
        onClick={onReveal}
        className="w-full py-4 rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-base hover:bg-red-500 transition-all hover:shadow-[0_0_24px_rgba(255,60,60,0.4)] active:scale-[0.98]"
      >
        Reveal Results →
      </button>
    </div>
  );
}

function ResultsScreen({
  picks,
  opponentPicks,
  outcomes,
}: {
  picks: Pick[];
  opponentPicks: Record<string, "yes" | "no">;
  outcomes: Record<string, "yes" | "no">;
}) {
  const yourCorrect = DAILY_MARKETS.filter(
    (m, i) => picks[i] !== null && picks[i] === outcomes[m.id]
  ).length;
  const theirCorrect = DAILY_MARKETS.filter((m) => opponentPicks[m.id] === outcomes[m.id]).length;
  const youWin = yourCorrect >= theirCorrect; // tie goes to challenger

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Result banner */}
      <div
        className={`rounded-2xl border-2 p-6 flex flex-col items-center gap-2 text-center ${
          youWin
            ? "border-[var(--color-success)] bg-[var(--color-success-dim)]"
            : "border-[var(--color-danger)] bg-[var(--color-danger-dim)]"
        }`}
      >
        <span className="text-4xl">{youWin ? "🏆" : "😤"}</span>
        <h1 className="text-3xl font-display font-black tracking-tight">
          {youWin
            ? yourCorrect === theirCorrect
              ? "Tie — you win!"
              : "You win!"
            : `${OPPONENT.name} wins`}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          You: {yourCorrect}/{DAILY_MARKETS.length} · {OPPONENT.name}: {theirCorrect}/{DAILY_MARKETS.length}
        </p>
      </div>

      {/* Market breakdown */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] overflow-hidden">
        <div className="grid grid-cols-[1fr_60px_60px_60px] px-4 py-2 border-b border-[var(--color-border)] text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-wider">
          <span>Market</span>
          <span className="text-center">Result</span>
          <span className="text-center">You</span>
          <span className="text-center">{OPPONENT.emoji}</span>
        </div>
        {DAILY_MARKETS.map((m, i) => {
          const outcome = outcomes[m.id]!;
          const yours = picks[i];
          const theirs = opponentPicks[m.id]!;
          const youGot = yours === outcome;
          const theyGot = theirs === outcome;

          return (
            <div
              key={m.id}
              className="grid grid-cols-[1fr_60px_60px_60px] px-4 py-3 border-b border-[var(--color-border)] last:border-0 items-center"
            >
              <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate pr-2">
                {m.question}
              </p>
              <span className="text-center text-xs font-black text-[var(--color-text-muted)]">
                {outcome.toUpperCase()}
              </span>
              <span
                className={`text-center text-sm font-black ${
                  youGot ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
                }`}
              >
                {youGot ? "✓" : "✗"}
              </span>
              <span
                className={`text-center text-sm font-black ${
                  theyGot ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
                }`}
              >
                {theyGot ? "✓" : "✗"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => window.location.reload()}
          className="w-full py-4 rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-base hover:bg-red-500 transition-all hover:shadow-[0_0_24px_rgba(255,60,60,0.4)] active:scale-[0.98]"
        >
          Rematch →
        </button>
        <Link
          href="/blitz"
          className="w-full py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold text-sm text-center hover:border-[var(--color-brand-primary)]/50 transition-all"
        >
          ⚡ Play Blitz
        </Link>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function H2HClient() {
  const outcomes = getDailyOutcomes();
  const opponentPicks = getOpponentPicks();

  const [phase, setPhase] = useState<"intro" | "picking" | "locked" | "results">("intro");
  const [picks, setPicks] = useState<Pick[]>(Array(DAILY_MARKETS.length).fill(null));
  const [qIdx, setQIdx] = useState(0);

  function handlePick(i: number, choice: "yes" | "no") {
    const next = [...picks];
    next[i] = choice;
    setPicks(next);
    // auto-advance to next unpicked question
    const nextUnpicked = next.findIndex((p, j) => j > i && p === null);
    if (nextUnpicked !== -1) {
      setQIdx(nextUnpicked);
    } else {
      setQIdx(i); // stay on current so submit button appears
    }
  }

  if (phase === "intro") {
    return (
      <IntroScreen
        onStart={() => {
          setPicks(Array(DAILY_MARKETS.length).fill(null));
          setQIdx(0);
          setPhase("picking");
        }}
      />
    );
  }

  if (phase === "picking") {
    return (
      <PickingScreen
        picks={picks}
        qIdx={qIdx}
        onPick={handlePick}
        onBack={() => setPhase("intro")}
        onSubmit={() => setPhase("locked")}
      />
    );
  }

  if (phase === "locked") {
    return (
      <LockedScreen
        picks={picks}
        opponentPicks={opponentPicks}
        onReveal={() => setPhase("results")}
      />
    );
  }

  return (
    <ResultsScreen picks={picks} opponentPicks={opponentPicks} outcomes={outcomes} />
  );
}
