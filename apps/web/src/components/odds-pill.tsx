"use client";

import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

interface OddsPillProps {
  probability: number;
  side: "yes" | "no";
  className?: string;
}

export function OddsPill({ probability, side, className }: OddsPillProps) {
  const pct = Math.round(probability * 100);

  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={pct}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.2 }}
        className={clsx(
          "inline-flex items-center justify-center tabular-nums font-bold text-sm px-2.5 py-0.5 rounded-full",
          side === "yes"
            ? "bg-[var(--color-card-yes-dim)] text-[var(--color-card-yes)]"
            : "bg-[var(--color-card-no-dim)] text-[var(--color-card-no)]",
          className
        )}
      >
        {pct}¢
      </motion.span>
    </AnimatePresence>
  );
}
