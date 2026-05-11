"use client";

import { FormEvent, useMemo, useState } from "react";

type AiMode = "card" | "forecast" | "live" | "blitz" | "h2h";

interface AiMessage {
  role: "user" | "assistant";
  text: string;
}

interface AskTheCardAiProps {
  mode: AiMode;
  context: string;
  suggestions: string[];
}

const MODE_LABELS: Record<AiMode, string> = {
  card: "The Card",
  forecast: "Forecast",
  live: "Live",
  blitz: "Blitz",
  h2h: "H2H",
};

const STARTER_ANSWERS: Record<AiMode, string> = {
  card: "Ask about prices, model edge, risk profiles, fade mode, or how to build a stronger daily card.",
  forecast: "Ask about probability, Brier score, calibration buckets, or how to decide between 55%, 70%, and 90%.",
  live: "Ask about risk mode, boosts, late swaps, watchlists, or how live prices move during the game.",
  blitz: "Ask about power picks, streak scoring, speed tiers, par score, or when to skip a bad read.",
  h2h: "Ask about confidence picks, upset bonuses, rival scoring, tie rules, or challenge links.",
};

function answerFor(mode: AiMode, question: string, context: string) {
  const q = question.toLowerCase();

  if (q.includes("real money") || q.includes("gambling") || q.includes("wager")) {
    return "The Card is built as a free-to-play prediction and scoring product. Prices are probability-style signals for making picks, not an instruction to place a real-money bet.";
  }

  if (q.includes("price") || q.includes("cent") || q.includes("odds") || /\b\d{1,3}c\b/.test(q)) {
    return "Read the price as the market's rough probability. A 62c YES means the board is treating YES like about a 62% outcome. The useful question is whether your read is higher or lower than that number.";
  }

  if (q.includes("edge") || q.includes("model")) {
    return "Model edge compares The Card's estimate with the market price. If the model says YES should be 68% and the market is 58c, that is a YES edge. If the model is below the price, the cleaner read may be NO or a pass.";
  }

  if (q.includes("risk") || q.includes("conservative") || q.includes("aggressive")) {
    return "Risk changes the shape of the score. Conservative lowers the ceiling and favors safer reads, balanced keeps the default scoring, and aggressive raises the possible score while making misses hurt more.";
  }

  if (mode === "forecast" && (q.includes("brier") || q.includes("score") || q.includes("calibration"))) {
    return "Forecast uses Brier score, where lower is better. If you say 80% YES and YES happens, that is a strong result. If you say 80% YES and NO happens, the score punishes the overconfidence. Calibration asks whether your confidence levels match reality over many forecasts.";
  }

  if (mode === "forecast" && (q.includes("probability") || q.includes("percent") || q.includes("70") || q.includes("50"))) {
    return "Use 50% when you truly think the market is a coin flip. Move toward 60% or 70% when you have a real lean, and save 80% or higher for spots where you would be surprised to be wrong.";
  }

  if (mode === "live" && (q.includes("boost") || q.includes("swap") || q.includes("watch"))) {
    return "In Live, the watchlist is for tracking markets before you commit. Boost marks one pick as especially important, and late swap lets you remove a pick when the game state changes before your ticket is locked.";
  }

  if (mode === "blitz" && (q.includes("power") || q.includes("streak") || q.includes("speed") || q.includes("par"))) {
    return "Blitz rewards fast correct reads. Your power pick should be the market where your edge is clearest, streaks reward consecutive hits, and speed tiers separate instant reads from late leans.";
  }

  if (mode === "h2h" && (q.includes("confidence") || q.includes("rival") || q.includes("tie") || q.includes("upset"))) {
    return "H2H is match scoring. Both players answer the same markets, confidence can double one correct read, upset hits add separation, and close matches are shaped by the tie rule and swing moments.";
  }

  if (q.includes("what should i") || q.includes("how do i") || q.includes("best")) {
    return `For ${MODE_LABELS[mode]}, start with the market where your opinion is clearest. Compare your probability to the displayed price, avoid forcing weak reads, and use the page tools only when they match your actual confidence. ${context}`;
  }

  return `${STARTER_ANSWERS[mode]} ${context}`;
}

export function AskTheCardAi({ mode, context, suggestions }: AskTheCardAiProps) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<AiMessage[]>([
    { role: "assistant", text: STARTER_ANSWERS[mode] },
  ]);
  const label = MODE_LABELS[mode];
  const trimmed = question.trim();
  const latestAssistant = useMemo(() => [...messages].reverse().find((message) => message.role === "assistant"), [messages]);

  function ask(nextQuestion: string) {
    const clean = nextQuestion.trim();
    if (!clean) return;
    setMessages((current) => [
      ...current,
      { role: "user", text: clean },
      { role: "assistant", text: answerFor(mode, clean, context) },
    ]);
    setQuestion("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    ask(trimmed);
  }

  return (
    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Ask The Card AI</p>
          <p className="mt-1 text-sm font-semibold text-[var(--color-card-text)]">Ask a question about {label}.</p>
        </div>
        <span className="rounded-md bg-[var(--color-card-bg)] px-2 py-1 text-[10px] font-black uppercase text-[var(--color-card-muted)]">Context aware</span>
      </div>

      <div className="mt-4 rounded-lg bg-[var(--color-card-bg)] p-3">
        <p className="text-sm leading-relaxed text-[var(--color-card-text)]">{latestAssistant?.text}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => ask(suggestion)}
            className="rounded-lg border border-[var(--color-card-border)] px-3 py-2 text-left text-xs font-bold text-[var(--color-card-muted)] transition-colors hover:border-[var(--color-brand-primary)]/60 hover:text-[var(--color-card-text)]"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={`Ask about ${label}...`}
          className="min-h-11 flex-1 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] px-3 text-sm font-semibold text-[var(--color-card-text)] outline-none transition-colors placeholder:text-[var(--color-card-muted)] focus:border-[var(--color-brand-primary)]"
        />
        <button
          type="submit"
          disabled={!trimmed}
          className="rounded-lg bg-[var(--color-brand-primary)] px-4 py-3 text-xs font-black uppercase text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
