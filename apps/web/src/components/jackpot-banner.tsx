"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CURRENT_CONTEST,
  getPick,
  countdownToLock,
  isLocked,
  formatDollars,
  P10_PICK_EVENT,
} from "@/lib/perfect-ten-store";

export function JackpotBanner() {
  const [pickedCount, setPickedCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(countdownToLock);
  const [locked, setLocked] = useState(isLocked);

  const refresh = useCallback(() => {
    const p = getPick(CURRENT_CONTEST.id);
    setPickedCount(Object.keys(p.picks).length);
    setSubmitted(p.isSubmitted);
    setLocked(isLocked());
    setCountdown(countdownToLock());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(P10_PICK_EVENT, refresh);
    const tick = setInterval(() => {
      setCountdown(countdownToLock());
      setLocked(isLocked());
    }, 60_000);
    return () => {
      window.removeEventListener(P10_PICK_EVENT, refresh);
      clearInterval(tick);
    };
  }, [refresh]);

  const total = CURRENT_CONTEST.marketIds.length;
  const { jackpotAmount, rolloverWeeks, weekLabel } = CURRENT_CONTEST;

  return (
    <Link href="/perfect-ten" className="block group">
      <div className="rounded-xl overflow-hidden border-2 border-[var(--color-brand-primary)] relative shadow-lg group-hover:shadow-[var(--shadow-glow-strong)] transition-all">
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: "radial-gradient(ellipse at top left, #ff3c3c 0%, transparent 60%)" }}
        />

        <div className="relative p-5 flex flex-col gap-3 bg-gradient-to-br from-[var(--color-surface-1)] to-[var(--color-surface-2)]">
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
              {weekLabel}
            </span>
          </div>

          {/* Amount + pick status */}
          <div className="flex items-end justify-between gap-4">
            <motion.span
              animate={{ textShadow: ["0 0 20px rgba(255,60,60,0)", "0 0 30px rgba(255,60,60,0.3)", "0 0 20px rgba(255,60,60,0)"] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-5xl font-display font-black tracking-tight text-[var(--color-brand-primary)]"
            >
              {formatDollars(jackpotAmount)}
            </motion.span>

            <div className="flex flex-col items-end shrink-0 pb-1">
              {submitted ? (
                <span className="text-xs font-bold text-[var(--color-card-yes)]">Locked in ✓</span>
              ) : locked ? (
                <span className="text-xs font-semibold text-[var(--color-card-no)]">Picks locked</span>
              ) : (
                <>
                  <span className="text-xs font-bold text-[var(--color-card-text)]">
                    {pickedCount}/{total} picked
                  </span>
                  <span className="text-[10px] text-[var(--color-text-muted)]">
                    locks in {countdown}
                  </span>
                </>
              )}
            </div>
          </div>

          {rolloverWeeks > 1 && (
            <motion.span
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="text-xs text-[var(--color-brand-secondary)] font-bold"
            >
              {rolloverWeeks}-week rollover — nobody has hit all 10
            </motion.span>
          )}

          {/* CTA row */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-card-border)]">
            <p className="text-xs text-[var(--color-text-muted)]">
              {submitted
                ? "Results after all 10 markets resolve"
                : locked
                ? "New picks drop next Monday"
                : "Pick YES or NO on all 10 markets to enter"}
            </p>
            <span className="text-xs font-bold text-[var(--color-brand-primary)] group-hover:underline shrink-0 ml-2">
              {submitted ? "View →" : "Enter →"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
