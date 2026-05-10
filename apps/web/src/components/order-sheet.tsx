"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { exchange } from "@/lib/exchange";
import { savePosition } from "@/lib/user-store";
import type { Market, Odds } from "@thecard/types";

export const ORDER_PLACED_EVENT = "thecard:order:placed";

interface OrderSheetProps {
  open: boolean;
  market: Market;
  side: "yes" | "no";
  odds: Odds;
  onClose: () => void;
}

type SheetState = "input" | "confirming" | "success";

export function OrderSheet({ open, market, side, odds, onClose }: OrderSheetProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("10");
  const [sheetState, setSheetState] = useState<SheetState>("input");

  const price = side === "yes" ? odds.yes : odds.no;
  const priceCents = Math.round(price * 100);
  const dollarAmount = parseFloat(amount) || 0;
  const contracts = dollarAmount > 0 ? dollarAmount / price : 0;
  const payout = contracts; // $1 per contract on win

  const sideColor = side === "yes" ? "var(--color-card-yes)" : "var(--color-card-no)";
  const sideDimColor = side === "yes" ? "var(--color-card-yes-dim)" : "var(--color-card-no-dim)";

  async function handleConfirm() {
    if (!user || dollarAmount <= 0) return;
    setSheetState("confirming");
    try {
      const fill = await exchange.placeOrder(user.uid, {
        marketId: market.id,
        side,
        amountUsd: dollarAmount,
      });
      // Persist position to Firestore
      savePosition(user.uid, {
        marketId: fill.marketId,
        side: fill.side,
        amountUsd: fill.filledAmountUsd,
        contracts: fill.filledAmountUsd / fill.price,
        averagePrice: fill.price,
      }).catch(() => {});
      window.dispatchEvent(new Event(ORDER_PLACED_EVENT));
      setSheetState("success");
      setTimeout(() => {
        setSheetState("input");
        onClose();
      }, 1800);
    } catch {
      setSheetState("input");
    }
  }

  function handleClose() {
    setSheetState("input");
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-6 pb-10"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="flex flex-col gap-5 max-w-sm mx-auto">
              <AnimatePresence mode="wait">
                {sheetState === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-3 py-8"
                  >
                    <span
                      className="text-5xl font-black"
                      style={{ color: sideColor }}
                    >
                      ✓
                    </span>
                    <p className="text-base font-bold text-[var(--color-card-text)]">
                      Order placed!
                    </p>
                    <p className="text-sm text-[var(--color-card-muted)] text-center">
                      {contracts.toFixed(1)} {side.toUpperCase()} contracts on{" "}
                      <span className="text-[var(--color-card-text)] font-semibold">
                        {market.title}
                      </span>
                    </p>
                  </motion.div>
                ) : (
                  <motion.div key="form" className="flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-0.5 min-w-0 mr-3">
                        <span
                          className="text-[10px] font-black uppercase tracking-widest"
                          style={{ color: sideColor }}
                        >
                          {side.toUpperCase()} · {priceCents}¢
                        </span>
                        <p className="text-sm font-bold text-[var(--color-card-text)] leading-snug">
                          {market.title}
                        </p>
                      </div>
                      <button
                        onClick={handleClose}
                        className="text-xl leading-none text-[var(--color-card-muted)] hover:text-[var(--color-card-text)] transition-colors shrink-0"
                        aria-label="Close"
                      >
                        ×
                      </button>
                    </div>

                    {/* Amount input */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[var(--color-card-muted)]">
                        Amount
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--color-card-muted)]">
                          $
                        </span>
                        <input
                          type="number"
                          min="1"
                          max="500"
                          step="1"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] text-[var(--color-card-text)] font-semibold text-base pl-7 pr-4 py-3 focus:outline-none focus:border-[var(--color-card-accent)]"
                        />
                      </div>
                    </div>

                    {/* Order summary */}
                    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3.5 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[var(--color-card-muted)]">Contracts</span>
                        <span className="font-semibold text-[var(--color-card-text)]">
                          {dollarAmount > 0 ? contracts.toFixed(1) : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[var(--color-card-muted)]">Price per contract</span>
                        <span className="font-semibold text-[var(--color-card-text)]">
                          {priceCents}¢
                        </span>
                      </div>
                      <div className="h-px bg-[var(--color-card-border)]" />
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[var(--color-card-muted)]">
                          If {side.toUpperCase()} wins
                        </span>
                        <span className="font-bold" style={{ color: sideColor }}>
                          {dollarAmount > 0 ? `$${payout.toFixed(2)}` : "—"}
                        </span>
                      </div>
                    </div>

                    {/* Confirm button */}
                    <button
                      onClick={handleConfirm}
                      disabled={sheetState === "confirming" || dollarAmount <= 0}
                      className="w-full rounded-xl font-bold text-sm py-3.5 transition-all active:scale-[0.98] disabled:opacity-50"
                      style={{
                        backgroundColor: sideDimColor,
                        color: sideColor,
                        border: `1px solid color-mix(in srgb, ${sideColor} 30%, transparent)`,
                      }}
                    >
                      {sheetState === "confirming"
                        ? "Placing…"
                        : `Buy ${contracts > 0 ? contracts.toFixed(1) : "0"} ${side.toUpperCase()} · $${dollarAmount > 0 ? dollarAmount : "0"}`}
                    </button>

                    <p className="text-[10px] text-center text-[var(--color-card-muted)]">
                      Practice mode · No real funds at risk
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
