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
          Bet play-money. Build calibration. No account needed.
        </p>
      </header>

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

      <section className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
        <h2 className="text-xs font-semibold text-[var(--color-card-muted)] uppercase tracking-wider mb-3">
          What is calibration?
        </h2>
        <p className="text-sm text-[var(--color-card-muted)] leading-relaxed">
          A calibrated forecaster says "70%" and is right about 70% of the time —
          not 50%, not 100%. Most people are overconfident. Practice mode measures
          yours with the Brier score, the gold standard in forecasting research.
        </p>
        <p className="text-sm text-[var(--color-card-muted)] leading-relaxed mt-2">
          Predictions here are play-money — same markets as The Card,
          no real funds at risk. Build your track record first,
          then switch to real money when you&apos;re ready.
        </p>
      </section>
    </div>
  );
}
