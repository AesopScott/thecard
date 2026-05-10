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
    <div className="rounded-xl overflow-hidden border border-[var(--color-card-accent-dim)] relative">
      {/* Background gradient */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: "radial-gradient(ellipse at top left, #ff3c3c 0%, transparent 70%)",
        }}
      />

      <div className="relative p-4 flex flex-col gap-3">
        {/* Label row */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-[var(--color-card-accent)] tracking-widest uppercase">
            Perfect 10 · Jackpot
          </span>
          <span className="text-[10px] text-[var(--color-card-muted)] font-medium">
            Resets {resetsOn}
          </span>
        </div>

        {/* Amount */}
        <div className="flex items-end gap-3">
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-4xl font-black tracking-tight text-[var(--color-card-text)]"
          >
            {formatDollars(amount)}
          </motion.span>
          {rolloverWeeks > 1 && (
            <span className="text-xs text-[var(--color-card-accent)] font-semibold pb-1">
              {rolloverWeeks}-week rollover 🔥
            </span>
          )}
        </div>

        {/* How it works */}
        <p className="text-xs text-[var(--color-card-muted)] leading-relaxed">
          Predict all ten markets on Tonight&apos;s Card correctly and win the jackpot.
          Nobody has hit all ten in {rolloverWeeks} week{rolloverWeeks !== 1 ? "s" : ""}.
          Every trade earns entries — the more you trade, the more shots you get.
        </p>

        {/* Entry status */}
        <div className="flex items-center justify-between pt-1 border-t border-[var(--color-card-border)]">
          <span className="text-xs text-[var(--color-card-muted)]">
            Your entries this week
          </span>
          <span className="text-xs font-bold text-[var(--color-card-text)]">
            0 — sign in to track
          </span>
        </div>
      </div>
    </div>
  );
}
