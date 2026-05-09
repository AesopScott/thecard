"use client";

import type { Market } from "@thecard/types";
import { useForecast } from "@/hooks/use-forecast";
import { CalibrationDisplay } from "@/components/calibration-display";
import { QuestionRow } from "@/components/question-row";

interface LearnClientProps {
  markets: Market[];
}

export function LearnClient({ markets }: LearnClientProps) {
  const { forecasts, predict, calibration, resolvedCount, predictionsUntilScore } =
    useForecast();

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">

      <header>
        <h1 className="text-2xl font-black tracking-tight text-[var(--color-card-text)]">
          Practice Mode
        </h1>
        <p className="text-sm text-[var(--color-card-muted)] mt-1">
          Build calibration on real markets. No account, no money at risk.
        </p>
      </header>

      {/* How it works — show only until user has made a prediction */}
      {resolvedCount === 0 && Object.keys(forecasts).length === 0 && (
        <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 flex flex-col gap-4">
          <p className="text-xs font-semibold text-[var(--color-card-accent)] uppercase tracking-widest">
            How this works
          </p>
          {[
            {
              step: "1",
              label: "Pick a question below",
              desc: 'Tap "Predict" on any market — these are the same real markets on The Card, just play-money.',
            },
            {
              step: "2",
              label: "Set your probability",
              desc: "Don't just say YES or NO. Say how likely you think it is — 60%? 80%? 30%? Precision is the whole game.",
            },
            {
              step: "3",
              label: "Wait for resolution",
              desc: "Markets resolve automatically. A few seconds in demo mode; in live mode they resolve with the real event.",
            },
            {
              step: "4",
              label: "See your Brier score",
              desc: "Every prediction scores your accuracy. After 5 resolved predictions your calibration score unlocks.",
            },
          ].map(({ step, label, desc }) => (
            <div key={step} className="flex gap-3">
              <span className="text-xs font-black text-[var(--color-card-accent)] bg-[var(--color-card-accent-dim)] rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                {step}
              </span>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold text-[var(--color-card-text)]">{label}</p>
                <p className="text-xs text-[var(--color-card-muted)] leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <CalibrationDisplay
        score={calibration}
        resolvedCount={resolvedCount}
        predictionsUntilScore={predictionsUntilScore}
      />

      <section className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] px-4 py-1">
        <h2 className="text-xs font-semibold text-[var(--color-card-muted)] uppercase tracking-wider pt-4 pb-2">
          Today&apos;s Questions
        </h2>
        <ul className="flex flex-col">
          {markets.map((market) => (
            <QuestionRow
              key={market.id}
              market={market}
              forecast={forecasts[market.id]}
              onPredict={predict}
            />
          ))}
        </ul>
      </section>

      {/* Calibration explainer */}
      <section className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 flex flex-col gap-3">
        <h2 className="text-xs font-semibold text-[var(--color-card-muted)] uppercase tracking-wider">
          What is calibration?
        </h2>
        <p className="text-sm text-[var(--color-card-muted)] leading-relaxed">
          Calibration measures how well your confidence matches reality.
          If you say "70% likely" on ten things and seven of them happen —
          you&apos;re perfectly calibrated. Most people aren&apos;t.
          They say 90% when they mean 65%.
        </p>
        <p className="text-sm text-[var(--color-card-muted)] leading-relaxed">
          The Brier score (lower = better) quantifies this. Your calibration score
          here is the same method used by meteorologists, military intelligence analysts,
          and the superforecasters in Philip Tetlock&apos;s research. It&apos;s hard to game.
        </p>
        <div className="mt-1 pt-3 border-t border-[var(--color-card-border)] flex flex-col gap-1">
          <p className="text-xs font-semibold text-[var(--color-card-text)]">
            Why does this matter for betting?
          </p>
          <p className="text-xs text-[var(--color-card-muted)] leading-relaxed">
            On prediction markets, the crowd price is the aggregated confidence of
            everyone betting. If you&apos;re well-calibrated and the crowd isn&apos;t,
            you have an edge — you can find markets where the price is wrong.
            Practice mode is how you find out if you actually have that edge
            before you use real money to test it.
          </p>
        </div>
      </section>

    </div>
  );
}
