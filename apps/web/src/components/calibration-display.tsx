"use client";

import { motion } from "framer-motion";

interface CalibrationDisplayProps {
  score: number | null;
  resolvedCount: number;
  predictionsUntilScore: number;
}

export function CalibrationDisplay({
  score,
  resolvedCount,
  predictionsUntilScore,
}: CalibrationDisplayProps) {
  const getScoreColor = (s: number) => {
    if (s >= 75) return "#22c55e";
    if (s >= 50) return "#f59e0b";
    return "#ef4444";
  };

  const getScoreLabel = (s: number) => {
    if (s >= 85) return "Sharp";
    if (s >= 70) return "Calibrated";
    if (s >= 55) return "Decent";
    if (s >= 40) return "Noisy";
    return "Overconfident";
  };

  return (
    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5">
      <h2 className="text-xs font-semibold text-[var(--color-card-muted)] uppercase tracking-wider mb-4">
        Your Calibration
      </h2>

      {score !== null ? (
        <div className="flex items-end gap-3">
          <motion.span
            key={score}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-5xl font-black tabular-nums leading-none"
            style={{ color: getScoreColor(score) }}
          >
            {score}
          </motion.span>
          <div className="flex flex-col gap-0.5 pb-1">
            <span className="text-sm font-bold" style={{ color: getScoreColor(score) }}>
              {getScoreLabel(score)}
            </span>
            <span className="text-xs text-[var(--color-card-muted)]">
              {resolvedCount} resolved · out of 100
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-3xl font-black text-[var(--color-card-text)]">—</p>
          <div className="flex flex-col gap-1.5">
            <div className="h-1.5 rounded-full bg-[var(--color-card-border)] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[var(--color-card-accent)]"
                initial={{ width: 0 }}
                animate={{
                  width: `${((5 - predictionsUntilScore) / 5) * 100}%`,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <p className="text-xs text-[var(--color-card-muted)]">
              {predictionsUntilScore} more resolved prediction
              {predictionsUntilScore !== 1 ? "s" : ""} to unlock your score
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
