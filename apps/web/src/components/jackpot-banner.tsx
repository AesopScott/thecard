"use client";

import { motion } from "framer-motion";

interface JackpotBannerProps {
  amount: number;
  rolloverWeeks: number;
  resetsOn: string;
}

function formatDollars(n: number): string {
  return n >= 1000
    ? `$${(n / 1000).toFixed(0)}K`
    : `$${n.toLocaleString()}`;
}

export function JackpotBanner({ amount, rolloverWeeks, resetsOn }: JackpotBannerProps) {
  return (
    <div className="rounded-xl overflow-hidden border-2 border-[var(--color-brand-primary)] relative shadow-lg hover:shadow-[var(--shadow-glow-strong)] transition-all">
      {/* Background gradient - stronger */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: "radial-gradient(ellipse at top left, #ff3c3c 0%, transparent 60%)",
        }}
      />

      <div className="relative p-6 flex flex-col gap-4 bg-gradient-to-br from-[var(--color-surface-1)] to-[var(--color-surface-2)]">
        {/* Label row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-[var(--color-brand-primary)] tracking-widest uppercase">
              Perfect 10
            </span>
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-lg"
            >
              🔥
            </motion.span>
          </div>
          <span className="text-xs text-[var(--color-text-muted)] font-medium">
            Resets {resetsOn}
          </span>
        </div>

        {/* Amount - huge display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          className="relative"
        >
          <motion.span
            animate={{ textShadow: ["0 0 20px rgba(255,60,60,0)", "0 0 30px rgba(255,60,60,0.3)", "0 0 20px rgba(255,60,60,0)"] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-5xl font-display font-black tracking-tight text-[var(--color-brand-primary)]"
          >
            {formatDollars(amount)}
          </motion.span>
        </motion.div>

        {rolloverWeeks > 1 && (
          <motion.span
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="text-sm text-[var(--color-brand-secondary)] font-bold"
          >
            {rolloverWeeks}-week rollover on the line
          </motion.span>
        )}

        {/* How it works */}
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
          Predict all ten markets on Tonight&apos;s Card correctly and win the jackpot.
          Nobody has hit all ten in {rolloverWeeks} week{rolloverWeeks !== 1 ? "s" : ""}.
          Every trade earns entries — the more you trade, the more shots you get.
        </p>

        {/* Entry status */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--color-card-border)]">
          <span className="text-xs text-[var(--color-text-muted)]">
            Your entries this week
          </span>
          <span className="text-xs font-bold text-[var(--color-text-primary)]">
            0 — sign in to track
          </span>
        </div>
      </div>
    </div>
  );
}
