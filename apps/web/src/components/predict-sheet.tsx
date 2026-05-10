"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Market } from "@thecard/types";
import { ProbabilitySlider } from "./probability-slider";

interface PredictSheetProps {
  market: Market;
  crowdProbability?: number; // 0–100, current market YES price in cents
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (probability: number) => void;
}

export function PredictSheet({ market, crowdProbability, isOpen, onClose, onSubmit }: PredictSheetProps) {
  const [probability, setProbability] = useState(50);

  function handleSubmit() {
    onSubmit(probability / 100);
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-[var(--color-card-surface)] border-t border-[var(--color-card-border)] px-5 pb-10 pt-5 max-w-lg mx-auto"
          >
            {/* Drag handle */}
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[var(--color-card-border)]" />

            {/* Market context */}
            <div className="mb-6">
              <p className="text-[10px] font-semibold text-[var(--color-card-accent)] uppercase tracking-widest mb-1">
                {market.sport.toUpperCase()} · Play Money
              </p>
              <h2 className="text-lg font-bold text-[var(--color-card-text)] leading-snug">
                {market.title}
              </h2>
              <p className="text-sm text-[var(--color-card-muted)] mt-0.5">
                {market.subtitle}
              </p>
              {crowdProbability !== undefined && (
                <p className="text-xs text-[var(--color-card-muted)] mt-2">
                  The crowd says{" "}
                  <span className="font-bold text-[var(--color-card-text)]">
                    {crowdProbability}% YES
                  </span>
                  . What do you think?
                </p>
              )}
            </div>

            {/* Probability slider */}
            <ProbabilitySlider value={probability} onChange={setProbability} />

            {/* Submit */}
            <button
              onClick={handleSubmit}
              className="mt-6 w-full rounded-xl py-3.5 font-bold text-base text-white transition-opacity hover:opacity-90 active:scale-95"
              style={{
                background:
                  probability >= 50
                    ? "linear-gradient(135deg, #16a34a, #22c55e)"
                    : "linear-gradient(135deg, #b91c1c, #ef4444)",
              }}
            >
              Lock in {probability}% YES
            </button>

            <p className="mt-3 text-center text-xs text-[var(--color-card-muted)]">
              Play money only · No real funds at risk
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
