"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Market } from "@thecard/types";
import type { LocalForecast } from "@/lib/forecast-store";
import { PredictSheet } from "./predict-sheet";

interface QuestionRowProps {
  market: Market;
  forecast: LocalForecast | undefined;
  onPredict: (marketId: string, marketTitle: string, probability: number) => void;
}

export function QuestionRow({ market, forecast, onPredict }: QuestionRowProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const sportLabel = market.sport.toUpperCase();

  return (
    <>
      <li className="flex flex-col gap-2 py-3 border-b border-[var(--color-card-border)] last:border-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] font-semibold text-[var(--color-card-accent)] uppercase tracking-widest">
              {sportLabel}
            </span>
            <p className="text-sm font-semibold text-[var(--color-card-text)] leading-snug">
              {market.title}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!forecast ? (
              <motion.button
                key="predict"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setSheetOpen(true)}
                className="shrink-0 text-xs font-semibold text-[var(--color-card-accent)] border border-[var(--color-card-accent-dim)] rounded-lg px-3 py-1.5 hover:bg-[var(--color-card-accent-dim)] transition-colors"
              >
                Predict
              </motion.button>
            ) : forecast.outcome === null ? (
              <motion.div
                key="pending"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="shrink-0 flex flex-col items-end gap-0.5"
              >
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-lg"
                  style={{
                    color: forecast.probability >= 0.5 ? "#22c55e" : "#ef4444",
                    background:
                      forecast.probability >= 0.5 ? "#22c55e22" : "#ef444422",
                  }}
                >
                  {Math.round(forecast.probability * 100)}% YES
                </span>
                <span className="text-[10px] text-[var(--color-card-muted)]">resolving…</span>
              </motion.div>
            ) : (
              <motion.div
                key="resolved"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="shrink-0 flex flex-col items-end gap-0.5"
              >
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-lg"
                  style={{
                    color: forecast.outcome === "yes" ? "#22c55e" : "#ef4444",
                    background:
                      forecast.outcome === "yes" ? "#22c55e22" : "#ef444422",
                  }}
                >
                  {forecast.outcome === "yes" ? "✓ YES" : "✗ NO"}
                </span>
                {forecast.brierScore !== null && (
                  <span className="text-[10px] text-[var(--color-card-muted)]">
                    Brier: {forecast.brierScore.toFixed(2)}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Probability bar for resolved predictions */}
        {forecast && forecast.outcome !== null && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            className="flex items-center gap-2"
            style={{ originX: 0 }}
          >
            <div className="flex-1 h-1 rounded-full bg-[var(--color-card-border)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.round(forecast.probability * 100)}%`,
                  background:
                    forecast.outcome === "yes" ? "#22c55e" : "#ef4444",
                }}
              />
            </div>
            <span className="text-[10px] text-[var(--color-card-muted)] shrink-0">
              You: {Math.round(forecast.probability * 100)}%
            </span>
          </motion.div>
        )}
      </li>

      <PredictSheet
        market={market}
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSubmit={(prob) => onPredict(market.id, market.title, prob)}
      />
    </>
  );
}
