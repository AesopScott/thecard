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
        initial={{ opacity: 0, scale: 0.9, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 4 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={clsx(
          "inline-flex items-center justify-center tabular-nums font-display font-black text-lg px-3 py-1.5 rounded-lg shadow-md",
          side === "yes"
            ? "bg-[var(--color-card-yes-dim)] text-[var(--color-card-yes)] hover:bg-[var(--color-success)] hover:text-white hover:shadow-lg"
            : "bg-[var(--color-card-no-dim)] text-[var(--color-card-no)] hover:bg-[var(--color-danger)] hover:text-white hover:shadow-lg",
          className
        )}
      >
        {pct}¢
      </motion.span>
    </AnimatePresence>
  );
}
