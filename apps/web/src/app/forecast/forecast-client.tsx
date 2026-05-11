"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AskTheCardAi } from "@/components/ask-the-card-ai";
import { ExplainBetting } from "@/components/explain-betting";
import { ScoutFloaters } from "@/components/scout-mascot";
import {
  addForecast,
  clearForecasts,
  FORECAST_UPDATED_EVENT,
  loadForecasts,
  resolveForecast,
  type LocalForecast,
} from "@/lib/forecast-store";

type SportFilter = "all" | "NFL" | "NBA" | "MLB" | "NHL" | "UFC";
type ForecastQuestion = {
  id: string;
  sport: Exclude<SportFilter, "all">;
  title: string;
  detail: string;
  crowd: number;
  closesAt: string;
  difficulty: "Chalk" | "Toss-up" | "Trap" | "Longshot";
  outcome: "yes" | "no";
};

const QUESTIONS: ForecastQuestion[] = [
  {
    id: "forecast-nfl-chiefs-cover",
    sport: "NFL",
    title: "Chiefs cover the spread tonight",
    detail: "Market is leaning Chiefs, but not by enough to call it settled.",
    crowd: 58,
    closesAt: "8:20 PM",
    difficulty: "Trap",
    outcome: "yes",
  },
  {
    id: "forecast-nba-lebron-30",
    sport: "NBA",
    title: "LeBron scores 30+ against Boston",
    detail: "Usage is there. Pace is the question.",
    crowd: 44,
    closesAt: "9:00 PM",
    difficulty: "Toss-up",
    outcome: "no",
  },
  {
    id: "forecast-ufc-jones-retains",
    sport: "UFC",
    title: "Jones retains the heavyweight title",
    detail: "The board likes the favorite. You are judging whether it likes him enough.",
    crowd: 71,
    closesAt: "11:30 PM",
    difficulty: "Chalk",
    outcome: "yes",
  },
  {
    id: "forecast-mlb-dodgers-game-3",
    sport: "MLB",
    title: "Dodgers win Game 3",
    detail: "Bullpen availability makes the late innings messy.",
    crowd: 62,
    closesAt: "10:10 PM",
    difficulty: "Trap",
    outcome: "no",
  },
  {
    id: "forecast-nhl-ovechkin-goal",
    sport: "NHL",
    title: "Ovechkin scores tonight",
    detail: "Low base rate, high public attention.",
    crowd: 37,
    closesAt: "7:40 PM",
    difficulty: "Longshot",
    outcome: "yes",
  },
];

const CALIBRATION_BUCKETS = [
  { label: "0-30", min: 0, max: 0.3 },
  { label: "31-50", min: 0.31, max: 0.5 },
  { label: "51-70", min: 0.51, max: 0.7 },
  { label: "71-100", min: 0.71, max: 1 },
];

const FORECAST_EXPLANATION = [
  {
    title: "What you are setting",
    body: "Forecast is not a normal yes/no pick. You choose the exact probability that YES happens, from 1% to 99%. A 70% forecast means you think YES should happen about seven times out of ten in similar spots.",
  },
  {
    title: "Market comparison",
    body: "The crowd number is the current market read. If the market says 58% and you set 70%, you are saying the YES side is underpriced. If you set 42%, you are saying the NO side is the better read.",
  },
  {
    title: "How scoring works",
    body: "Resolved forecasts use Brier score. A perfect confident forecast scores near 0. Being confidently wrong scores near 1. Lower Brier is better because it rewards both accuracy and honest uncertainty.",
  },
  {
    title: "How to use it well",
    body: "Use 50% when you truly think it is a coin flip. Push toward 70%, 80%, or higher only when you have a strong reason. Your calibration buckets show whether your 70% calls actually hit like 70% calls over time.",
  },
];

const FORECAST_AI_SUGGESTIONS = [
  "How do I choose between 60% and 70%?",
  "What is a good Brier score?",
  "When should I disagree with the market?",
];

function clampProbability(value: number) {
  return Math.min(99, Math.max(1, value));
}

function brier(probability: number, outcome: "yes" | "no") {
  const outcomeNum = outcome === "yes" ? 1 : 0;
  return Math.pow(probability - outcomeNum, 2);
}

function skillLabel(avgBrier: number | null) {
  if (avgBrier === null) return "Unrated";
  if (avgBrier <= 0.12) return "Sharp";
  if (avgBrier <= 0.2) return "Calibrated";
  if (avgBrier <= 0.28) return "Developing";
  return "Needs reps";
}

function edgeLabel(probability: number, crowd: number) {
  const delta = Math.round(probability * 100 - crowd);
  if (Math.abs(delta) < 5) return "With market";
  return delta > 0 ? `+${delta} vs market` : `${delta} vs market`;
}

function formatPercent(probability: number) {
  return `${Math.round(probability * 100)}%`;
}

function readForecastsForQuestions() {
  const all = loadForecasts();
  return Object.fromEntries(QUESTIONS.map((question) => [question.id, all[question.id]]));
}

export function ForecastClient() {
  const [forecasts, setForecasts] = useState<Record<string, LocalForecast | undefined>>({});
  const [drafts, setDrafts] = useState<Record<string, number>>(
    Object.fromEntries(QUESTIONS.map((question) => [question.id, question.crowd]))
  );
  const [filter, setFilter] = useState<SportFilter>("all");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setForecasts(readForecastsForQuestions());
    const refresh = () => setForecasts(readForecastsForQuestions());
    window.addEventListener(FORECAST_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(FORECAST_UPDATED_EVENT, refresh);
  }, []);

  const visibleQuestions = useMemo(
    () => QUESTIONS.filter((question) => filter === "all" || question.sport === filter),
    [filter]
  );

  const resolved = Object.values(forecasts).filter(
    (forecast): forecast is LocalForecast => Boolean(forecast && forecast.outcome !== null && forecast.brierScore !== null)
  );
  const pending = Object.values(forecasts).filter((forecast) => forecast && forecast.outcome === null).length;
  const avgBrier = resolved.length > 0
    ? resolved.reduce((sum, forecast) => sum + (forecast.brierScore ?? 0), 0) / resolved.length
    : null;
  const calibrationScore = avgBrier === null ? null : Math.max(0, Math.round((1 - avgBrier) * 100));
  const marketBeats = resolved.filter((forecast) => {
    if (forecast.outcome === null || forecast.crowdProbability === undefined) return false;
    return brier(forecast.probability, forecast.outcome) < brier(forecast.crowdProbability, forecast.outcome);
  }).length;

  function savePick(question: ForecastQuestion) {
    const probability = clampProbability(drafts[question.id] ?? question.crowd) / 100;
    addForecast({
      marketId: question.id,
      marketTitle: question.title,
      probability,
      crowdProbability: question.crowd / 100,
      createdAt: Date.now(),
    });
    setStatus(`Locked ${Math.round(probability * 100)}% on ${question.sport}.`);
  }

  function resolveOne(question: ForecastQuestion) {
    resolveForecast(question.id, question.outcome);
    setStatus(`Resolved: ${question.title}`);
  }

  function resolveAll() {
    QUESTIONS.forEach((question) => resolveForecast(question.id, question.outcome));
    setStatus("Resolved today's mock board.");
  }

  function reset() {
    clearForecasts();
    setStatus("Forecast board reset.");
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 pb-28">
      <ScoutFloaters page="forecast" />
      <section className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-6">
          <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Forecast Lab</p>
          <h1 className="mt-3 text-5xl font-display font-black tracking-tight text-[var(--color-text-primary)]">
            Train probability, not vibes.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)]">
            Set precise probabilities on today&apos;s mock sports board, compare yourself to the market, then resolve the slate and see your calibration.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Resolved" value={resolved.length} />
            <Stat label="Pending" value={pending} />
            <Stat label="Score" value={calibrationScore ?? "--"} />
            <Stat label="Level" value={skillLabel(avgBrier)} />
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5">
          <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Calibration Read</p>
          <div className="mt-4 rounded-xl bg-[var(--color-surface-2)] p-4">
            <p className="text-5xl font-display font-black text-[var(--color-text-primary)]">
              {avgBrier === null ? "--" : avgBrier.toFixed(3)}
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">Average Brier score. Lower is better.</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="Beat Mkt" value={`${marketBeats}/${resolved.length || 0}`} />
            <Stat label="Best Zone" value={bestBucketLabel(resolved)} />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={resolveAll} className="flex-1 rounded-xl bg-[var(--color-brand-primary)] py-3 text-sm font-black text-white transition-all hover:bg-red-500">
              Resolve Mock Slate
            </button>
            <button onClick={reset} className="rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-bold text-[var(--color-text-muted)] transition-all hover:border-[var(--color-brand-primary)]/50">
              Reset
            </button>
          </div>
          {status && <p className="mt-3 text-xs font-semibold text-[var(--color-success)]">{status}</p>}
        </div>
      </section>

      <ExplainBetting
        buttonLabel="Explain forecast betting"
        title="Forecast is about probability skill, not just picking winners."
        summary="Every question is a YES/NO market, but the important part is how confident you are. Forecast teaches you whether your confidence matches reality, then compares that read against the market."
        sections={FORECAST_EXPLANATION}
      />

      <AskTheCardAi
        mode="forecast"
        context="On this page, lock your exact YES probability, resolve the mock slate, then use Brier score and calibration buckets to learn whether your confidence is too high, too low, or well tuned."
        suggestions={FORECAST_AI_SUGGESTIONS}
      />

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Daily Board</p>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-[var(--color-surface-2)] p-1 sm:grid-cols-6">
              {(["all", "NFL", "NBA", "MLB", "NHL", "UFC"] as SportFilter[]).map((item) => (
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

          <div className="mt-4 flex flex-col gap-3">
            {visibleQuestions.map((question) => (
              <ForecastCard
                key={question.id}
                question={question}
                forecast={forecasts[question.id]}
                draft={drafts[question.id] ?? question.crowd}
                onDraft={(value) => setDrafts((current) => ({ ...current, [question.id]: value }))}
                onSave={() => savePick(question)}
                onResolve={() => resolveOne(question)}
              />
            ))}
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <CalibrationBuckets forecasts={resolved} />
          <ForecastHistory forecasts={Object.values(forecasts).filter(Boolean) as LocalForecast[]} />
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5">
            <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Next reps</p>
            <div className="mt-4 flex flex-col gap-2">
              <Link href="/blitz" className="rounded-xl bg-[var(--color-brand-primary)] py-3 text-center text-sm font-black text-white transition-all hover:bg-red-500">
                Play Blitz
              </Link>
              <Link href="/card" className="rounded-xl border border-[var(--color-border)] py-3 text-center text-sm font-bold text-[var(--color-text-muted)] transition-all hover:border-[var(--color-brand-primary)]/50">
                Open The Card
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function ForecastCard({
  question,
  forecast,
  draft,
  onDraft,
  onSave,
  onResolve,
}: {
  question: ForecastQuestion;
  forecast: LocalForecast | undefined;
  draft: number;
  onDraft: (value: number) => void;
  onSave: () => void;
  onResolve: () => void;
}) {
  const resolved = forecast?.outcome !== null && forecast?.outcome !== undefined;
  const forecastPct = forecast ? Math.round(forecast.probability * 100) : draft;
  const previewBrier = brier(draft / 100, question.outcome);

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[var(--color-surface-3)] px-2 py-1 text-[10px] font-black uppercase text-[var(--color-text-muted)]">{question.sport}</span>
            <span className="rounded-md border border-[var(--color-border)] px-2 py-1 text-[10px] font-black uppercase text-[var(--color-brand-primary)]">{question.difficulty}</span>
            <span className="text-xs text-[var(--color-text-muted)]">Closes {question.closesAt}</span>
          </div>
          <h2 className="mt-2 text-lg font-black leading-snug text-[var(--color-text-primary)]">{question.title}</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{question.detail}</p>
        </div>
        <div className="shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-1)] px-3 py-2 text-right">
          <p className="text-[10px] font-black uppercase text-[var(--color-text-muted)]">Market</p>
          <p className="text-lg font-black text-[var(--color-text-primary)]">{question.crowd}%</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-bold text-[var(--color-danger)]">NO {100 - forecastPct}%</span>
          <span className="font-black text-[var(--color-text-primary)]">{forecastPct}% YES</span>
          <span className="font-bold text-[var(--color-success)]">YES {forecastPct}%</span>
        </div>
        <input
          type="range"
          min={1}
          max={99}
          value={forecastPct}
          disabled={Boolean(forecast)}
          onChange={(event) => onDraft(clampProbability(Number(event.target.value)))}
          className="w-full accent-[var(--color-brand-primary)]"
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <Stat label="Your Edge" value={edgeLabel(forecastPct / 100, question.crowd)} />
        <Stat label="If Resolved" value={previewBrier.toFixed(2)} />
        <Stat label="Status" value={resolved ? `Hit ${question.outcome.toUpperCase()}` : forecast ? "Locked" : "Draft"} />
        <Stat label="Brier" value={forecast?.brierScore === null || forecast?.brierScore === undefined ? "--" : forecast.brierScore.toFixed(2)} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!forecast ? (
          <button onClick={onSave} className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2.5 text-sm font-black text-white transition-all hover:bg-red-500">
            Lock Forecast
          </button>
        ) : forecast.outcome === null ? (
          <button onClick={onResolve} className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-bold text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-brand-primary)]/50">
            Resolve Mock
          </button>
        ) : (
          <span className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-bold text-[var(--color-text-muted)]">
            Resolved {forecast.outcome.toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-1)] px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}

function CalibrationBuckets({ forecasts }: { forecasts: LocalForecast[] }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5">
      <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Calibration Map</p>
      <div className="mt-4 flex flex-col gap-2">
        {CALIBRATION_BUCKETS.map((bucket) => {
          const rows = forecasts.filter((forecast) => forecast.probability >= bucket.min && forecast.probability <= bucket.max);
          const hitRate = rows.length === 0
            ? null
            : Math.round((rows.filter((forecast) => forecast.outcome === "yes").length / rows.length) * 100);
          return (
            <div key={bucket.label} className="grid grid-cols-[64px_1fr_48px] items-center gap-2 text-xs">
              <span className="font-bold text-[var(--color-text-muted)]">{bucket.label}%</span>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                <div className="h-full rounded-full bg-[var(--color-brand-primary)]" style={{ width: `${hitRate ?? 0}%` }} />
              </div>
              <span className="text-right font-black text-[var(--color-text-primary)]">{hitRate === null ? "--" : `${hitRate}%`}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ForecastHistory({ forecasts }: { forecasts: LocalForecast[] }) {
  const sorted = [...forecasts].sort((a, b) => b.createdAt - a.createdAt);
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5">
      <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Forecast Log</p>
      {sorted.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">Locked forecasts will appear here.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {sorted.map((forecast) => (
            <div key={forecast.marketId} className="rounded-lg bg-[var(--color-surface-2)] px-3 py-2">
              <p className="truncate text-sm font-bold text-[var(--color-text-primary)]">{forecast.marketTitle}</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                You {formatPercent(forecast.probability)}
                {forecast.outcome ? ` - ${forecast.outcome.toUpperCase()} - Brier ${forecast.brierScore?.toFixed(2)}` : " - pending"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function bestBucketLabel(forecasts: LocalForecast[]) {
  if (forecasts.length === 0) return "--";
  const buckets = CALIBRATION_BUCKETS.map((bucket) => {
    const rows = forecasts.filter((forecast) => forecast.probability >= bucket.min && forecast.probability <= bucket.max);
    const avg = rows.length === 0
      ? Number.POSITIVE_INFINITY
      : rows.reduce((sum, forecast) => sum + (forecast.brierScore ?? 0), 0) / rows.length;
    return { label: bucket.label, avg };
  }).sort((a, b) => a.avg - b.avg);
  return buckets[0]?.avg === Number.POSITIVE_INFINITY ? "--" : buckets[0]?.label ?? "--";
}
