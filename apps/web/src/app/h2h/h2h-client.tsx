"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EmailVerificationNotice } from "@/components/email-verification-notice";
import { SignInSheet } from "@/components/sign-in-sheet";
import { useAuth } from "@/contexts/auth-context";
import { DAILY_MARKETS, getDailyOutcomes, getOpponentPicks } from "@/lib/daily-markets";
import { getStoredH2HRun, saveH2HRun, type H2HRun, type H2HPick } from "@/lib/h2h-store";

type Pick = H2HPick | null;

const OPPONENT = {
  name: "MarketMike",
  emoji: "MM",
  record: "12W - 4L",
  winPct: 75,
};

function timeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const ms = midnight.getTime() - now.getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

function IntroScreen({
  savedRun,
  onStart,
  onViewResults,
}: {
  savedRun: H2HRun | null;
  onStart: () => void;
  onViewResults: () => void;
}) {
  if (savedRun) {
    const youWin = savedRun.result !== "loss";

    return (
      <div className="max-w-lg mx-auto px-4 py-12 flex flex-col gap-8 items-center text-center">
        <div className="text-6xl">H2H</div>
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-display font-black tracking-tight">Head&#x2011;to&#x2011;Head</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Already played today.</p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-6 w-full flex flex-col items-center gap-2">
          <span className={`text-4xl font-display font-black ${youWin ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
            {savedRun.result === "tie-win" ? "Tie win" : youWin ? "You win" : `${OPPONENT.name} wins`}
          </span>
          <span className="text-sm text-[var(--color-text-muted)]">
            You: {savedRun.yourCorrect}/{DAILY_MARKETS.length} - {OPPONENT.name}: {savedRun.opponentCorrect}/{DAILY_MARKETS.length}
          </span>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onViewResults}
            className="w-full py-4 rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-base hover:bg-red-500 transition-all active:scale-[0.98]"
          >
            See Results
          </button>
          <Link
            href="/blitz"
            className="w-full py-4 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold text-sm text-center hover:border-[var(--color-brand-primary)]/50 transition-all"
          >
            Play Blitz
          </Link>
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">Next match in {timeUntilMidnight()}</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12 flex flex-col gap-8 items-center text-center">
      <div className="text-6xl">H2H</div>
      <div className="flex flex-col gap-3">
        <h1 className="text-5xl font-display font-black tracking-tight">Head&#x2011;to&#x2011;Head</h1>
        <p className="text-[var(--color-text-secondary)] text-base leading-relaxed max-w-xs mx-auto">
          You vs the market. Same 5 markets, no timer. Most right wins.
        </p>
      </div>

      <div className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5 flex items-center gap-4">
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-3xl">You</span>
          <span className="text-sm font-black text-[var(--color-text-primary)]">You</span>
          <span className="text-xs text-[var(--color-text-muted)]">challenger</span>
        </div>
        <span className="text-2xl font-display font-black text-[var(--color-text-muted)]">vs</span>
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-3xl">{OPPONENT.emoji}</span>
          <span className="text-sm font-black text-[var(--color-text-primary)]">{OPPONENT.name}</span>
          <span className="text-xs text-[var(--color-text-muted)]">
            {OPPONENT.record} - {OPPONENT.winPct}%
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
            <span className="text-[var(--color-brand-primary)] font-bold shrink-0">-</span>
            <span>{line}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onStart}
        className="w-full py-5 rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-lg hover:bg-red-500 transition-all hover:shadow-[0_0_24px_rgba(255,60,60,0.4)] active:scale-[0.98]"
      >
        Make Your Picks
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
  submitting,
  error,
}: {
  picks: Pick[];
  qIdx: number;
  onPick: (i: number, c: H2HPick) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const market = DAILY_MARKETS[qIdx]!;
  const allPicked = picks.every((p) => p !== null);
  const current = picks[qIdx];

  return (
    <div className="max-w-lg mx-auto px-4 flex flex-col" style={{ height: "calc(100dvh - 80px)" }}>
      <div className="flex items-center justify-between pt-4 flex-shrink-0">
        <button
          onClick={onBack}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          Back
        </button>
        <span className="text-sm font-black text-[var(--color-text-muted)]">
          {qIdx + 1} of {DAILY_MARKETS.length}
        </span>
      </div>

      <div className="flex gap-2 mt-4 flex-shrink-0">
        {DAILY_MARKETS.map((_, i) => (
          <button
            key={i}
            onClick={() => onPick(i, picks[i] ?? "yes")}
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

      <div className="flex-1 flex flex-col justify-center gap-5 py-6">
        <span className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest">
          {market.sport}
        </span>
        <h2 className="text-3xl font-display font-black tracking-tight leading-tight text-[var(--color-text-primary)]">
          {market.question}
        </h2>
        <div className="flex gap-4 text-sm text-[var(--color-text-muted)]">
          <span>
            <span className="font-black text-[var(--color-success)]">{market.yes}c</span> YES
          </span>
          <span>-</span>
          <span>
            <span className="font-black text-[var(--color-danger)]">{market.no}c</span> NO
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 pb-6 flex-shrink-0">
        <button
          onClick={() => onPick(qIdx, "yes")}
          className={`w-full py-5 rounded-xl font-black text-xl transition-all active:scale-[0.97] ${
            current === "yes"
              ? "bg-[var(--color-success)] text-white ring-2 ring-[var(--color-success)]"
              : "bg-[var(--color-success-dim)] text-[var(--color-success)] hover:bg-[var(--color-success)] hover:text-white"
          }`}
        >
          YES {current === "yes" && "selected"}
        </button>
        <button
          onClick={() => onPick(qIdx, "no")}
          className={`w-full py-5 rounded-xl font-black text-xl transition-all active:scale-[0.97] ${
            current === "no"
              ? "bg-[var(--color-danger)] text-white ring-2 ring-[var(--color-danger)]"
              : "bg-[var(--color-danger-dim)] text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white"
          }`}
        >
          NO {current === "no" && "selected"}
        </button>

        {allPicked && (
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="w-full py-4 rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-base hover:bg-red-500 transition-all hover:shadow-[0_0_24px_rgba(255,60,60,0.4)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 mt-1"
          >
            {submitting ? "Saving..." : "Lock In Picks"}
          </button>
        )}
        {error && <p className="rounded-lg border border-[var(--color-danger)]/30 px-3 py-2 text-xs text-[var(--color-danger)]">{error}</p>}
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
  opponentPicks: Record<string, H2HPick>;
  onReveal: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest">
          Picks Locked
        </p>
        <h1 className="text-3xl font-display font-black tracking-tight">
          You vs {OPPONENT.name}
        </h1>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] overflow-hidden">
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
                {diff && " *"}
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
        Reveal Results
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
  opponentPicks: Record<string, H2HPick>;
  outcomes: Record<string, H2HPick>;
}) {
  const yourCorrect = DAILY_MARKETS.filter(
    (m, i) => picks[i] !== null && picks[i] === outcomes[m.id]
  ).length;
  const theirCorrect = DAILY_MARKETS.filter((m) => opponentPicks[m.id] === outcomes[m.id]).length;
  const youWin = yourCorrect >= theirCorrect;

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
      <div
        className={`rounded-2xl border-2 p-6 flex flex-col items-center gap-2 text-center ${
          youWin
            ? "border-[var(--color-success)] bg-[var(--color-success-dim)]"
            : "border-[var(--color-danger)] bg-[var(--color-danger-dim)]"
        }`}
      >
        <span className="text-4xl">{youWin ? "WIN" : "LOSS"}</span>
        <h1 className="text-3xl font-display font-black tracking-tight">
          {youWin ? (yourCorrect === theirCorrect ? "Tie - you win!" : "You win!") : `${OPPONENT.name} wins`}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          You: {yourCorrect}/{DAILY_MARKETS.length} - {OPPONENT.name}: {theirCorrect}/{DAILY_MARKETS.length}
        </p>
      </div>

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
                {youGot ? "Y" : "N"}
              </span>
              <span
                className={`text-center text-sm font-black ${
                  theyGot ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
                }`}
              >
                {theyGot ? "Y" : "N"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/card"
          className="w-full py-4 rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-base text-center hover:bg-red-500 transition-all hover:shadow-[0_0_24px_rgba(255,60,60,0.4)] active:scale-[0.98]"
        >
          Tonight&apos;s Card
        </Link>
        <Link
          href="/blitz"
          className="w-full py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold text-sm text-center hover:border-[var(--color-brand-primary)]/50 transition-all"
        >
          Play Blitz
        </Link>
      </div>
      <p className="text-xs text-[var(--color-text-muted)] text-center">
        Next match in {timeUntilMidnight()}
      </p>
    </div>
  );
}

export function H2HClient() {
  const { user, verificationRequired } = useAuth();
  const outcomes = getDailyOutcomes();
  const opponentPicks = getOpponentPicks();

  const [phase, setPhase] = useState<"intro" | "picking" | "locked" | "results">("intro");
  const [picks, setPicks] = useState<Pick[]>(Array(DAILY_MARKETS.length).fill(null));
  const [qIdx, setQIdx] = useState(0);
  const [savedRun, setSavedRun] = useState<H2HRun | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || verificationRequired) {
      setSavedRun(null);
      return;
    }
    getStoredH2HRun(user.uid)
      .then((run) => {
        if (!run) return;
        setSavedRun(run);
        setPicks(run.picks);
      })
      .catch(() => setSaveError("Could not load today's Head-to-Head result."));
  }, [user, verificationRequired]);

  const displayedOpponentPicks = savedRun?.opponentPicks ?? opponentPicks;
  const displayedOutcomes = savedRun?.outcomes ?? outcomes;

  function handlePick(i: number, choice: H2HPick) {
    const next = [...picks];
    next[i] = choice;
    setPicks(next);
    const nextUnpicked = next.findIndex((p, j) => j > i && p === null);
    setQIdx(nextUnpicked !== -1 ? nextUnpicked : i);
  }

  function startGame() {
    if (!user) {
      setSignInOpen(true);
      return;
    }
    if (verificationRequired || savedRun) return;
    setSaveError(null);
    setPicks(Array(DAILY_MARKETS.length).fill(null));
    setQIdx(0);
    setPhase("picking");
  }

  async function submitPicks() {
    if (!user) {
      setSignInOpen(true);
      return;
    }
    if (verificationRequired || saving) return;
    if (!picks.every((pick): pick is H2HPick => pick === "yes" || pick === "no")) return;
    setSaving(true);
    setSaveError(null);
    try {
      const run = await saveH2HRun(user.uid, picks);
      setSavedRun(run);
      setPicks(run.picks);
      setPhase("locked");
    } catch {
      setSaveError("Your picks could not be saved. Try locking them in again.");
    } finally {
      setSaving(false);
    }
  }

  if (phase === "intro") {
    return (
      <>
        <IntroScreen
          savedRun={savedRun}
          onStart={startGame}
          onViewResults={() => {
            if (!savedRun) return;
            setPicks(savedRun.picks);
            setPhase("results");
          }}
        />
        <div className="mx-auto max-w-lg px-4 pb-24">
          {!user && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4 text-center">
              <p className="text-sm font-bold text-[var(--color-text-primary)]">Sign in to play Head-to-Head</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">One verified account match per day.</p>
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

  if (phase === "picking") {
    return (
      <PickingScreen
        picks={picks}
        qIdx={qIdx}
        onPick={handlePick}
        onBack={() => setPhase("intro")}
        onSubmit={submitPicks}
        submitting={saving}
        error={saveError}
      />
    );
  }

  if (phase === "locked") {
    return (
      <LockedScreen
        picks={picks}
        opponentPicks={displayedOpponentPicks}
        onReveal={() => setPhase("results")}
      />
    );
  }

  return (
    <ResultsScreen picks={picks} opponentPicks={displayedOpponentPicks} outcomes={displayedOutcomes} />
  );
}
