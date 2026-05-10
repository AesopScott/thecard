"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { exchange } from "@/lib/exchange";
import { closeAccountPosition, placeAccountOrder } from "@/lib/account-order";
import { subscribeToPositions } from "@/lib/user-store";
import { isFirebaseConfigured } from "@/lib/firebase";
import type { Market, Odds, Position } from "@thecard/types";

// ── Types ──────────────────────────────────────────────────────────────────

interface LimitOrder {
  enabled: boolean;
  price: number; // in cents (1–99)
}

interface AutoBuyOrder {
  enabled: boolean;
  price: number;  // in cents — buy more when odds fall to this
  amount: number; // dollars
}

interface LimitOrders {
  takeProfit: LimitOrder;
  stopLoss: LimitOrder;
  autoBuy: AutoBuyOrder;
}

function defaultOrders(currentCents: number): LimitOrders {
  return {
    takeProfit: { enabled: false, price: Math.min(95, currentCents + 15) },
    stopLoss:   { enabled: false, price: Math.max(5,  currentCents - 15) },
    autoBuy:    { enabled: false, price: Math.max(5,  currentCents - 10), amount: 10 },
  };
}

// ── PositionsPanel ─────────────────────────────────────────────────────────

export function PositionsPanel() {
  const { user } = useAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);

  useEffect(() => { exchange.getMarkets().then(setMarkets); }, []);

  useEffect(() => {
    if (!user) { setPositions([]); return; }
    if (isFirebaseConfigured) return subscribeToPositions(user.uid, setPositions);
    const uid = user.uid;
    exchange.getPositions(uid).then(setPositions);
    const handler = () => exchange.getPositions(uid).then(setPositions);
    window.addEventListener("thecard:order:placed", handler);
    return () => window.removeEventListener("thecard:order:placed", handler);
  }, [user]);

  if (!user || positions.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-[var(--color-card-text)]">Your Positions</h2>
        <span className="text-xs text-[var(--color-card-muted)]">{positions.length} open</span>
      </div>
      <div className="flex flex-col gap-2">
        {positions.map((pos) => (
          <PositionRow key={pos.id ?? pos.marketId} position={pos} markets={markets} />
        ))}
      </div>
    </div>
  );
}

// ── PositionRow ────────────────────────────────────────────────────────────

function PositionRow({ position, markets }: { position: Position; markets: Market[] }) {
  const { user } = useAuth();
  const [odds, setOdds] = useState<Odds | null>(null);
  const [selling, setSelling] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [orders, setOrders] = useState<LimitOrders | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const firedRef = useRef({ takeProfit: false, stopLoss: false, autoBuy: false });
  const ordersRef = useRef(orders);
  useEffect(() => { ordersRef.current = orders; }, [orders]);

  const isYes = position.side === "yes";
  const sideColor = isYes ? "var(--color-card-yes)" : "var(--color-card-no)";
  const market = markets.find((m) => m.id === position.marketId);
  const cost = position.contracts * position.averagePrice;
  const currentPrice = odds ? (isYes ? odds.yes : odds.no) : position.averagePrice;
  const currentCents = Math.round(currentPrice * 100);
  const currentValue = position.contracts * currentPrice;
  const pnl = currentValue - cost;
  const pnlPositive = pnl >= 0;

  // Initialise default orders once current price is known
  useEffect(() => {
    if (odds && !orders) setOrders(defaultOrders(Math.round(currentPrice * 100)));
  }, [odds, orders, currentPrice]);

  // Subscribe to live odds
  useEffect(() => {
    exchange.getOdds(position.marketId).then(setOdds);
    return exchange.subscribeToMarket(position.marketId, setOdds);
  }, [position.marketId]);

  // Check limit order thresholds on every odds tick
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!odds || !user || !position.id) return;
    const cp = isYes ? odds.yes : odds.no;
    const o = ordersRef.current;
    const fired = firedRef.current;
    if (!o) return;

    if (o.takeProfit.enabled && !fired.takeProfit && cp >= o.takeProfit.price / 100) {
      fired.takeProfit = true;
      fireOrder(`Take-profit hit at ${Math.round(cp * 100)}¢ — selling`);
      if (!market) return;
      setTimeout(() => {
        closeAccountPosition({ uid: user.uid, positionId: position.id!, market, currentValue })
          .then(() => window.dispatchEvent(new Event("thecard:order:placed")))
          .catch(() => fireOrder("Auto-sell failed. Try selling manually."));
      }, 400);
    }

    if (o.stopLoss.enabled && !fired.stopLoss && cp <= o.stopLoss.price / 100) {
      fired.stopLoss = true;
      fireOrder(`Stop-loss hit at ${Math.round(cp * 100)}¢ — selling`);
      if (!market) return;
      setTimeout(() => {
        closeAccountPosition({ uid: user.uid, positionId: position.id!, market, currentValue })
          .then(() => window.dispatchEvent(new Event("thecard:order:placed")))
          .catch(() => fireOrder("Auto-sell failed. Try selling manually."));
      }, 400);
    }

    if (o.autoBuy.enabled && !fired.autoBuy && cp <= o.autoBuy.price / 100) {
      fired.autoBuy = true;
      fireOrder(`Auto-buy at ${Math.round(cp * 100)}¢ — adding $${o.autoBuy.amount}`);
      if (!market) return;
      placeAccountOrder({ uid: user.uid, market, side: position.side, amountUsd: o.autoBuy.amount })
        .then(() => window.dispatchEvent(new Event("thecard:order:placed")))
        .catch(() => fireOrder("Auto-buy skipped - insufficient bankroll"));
    }
  }, [odds]);

  function fireOrder(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSell() {
    if (!user || !position.id || !market || selling) return;
    setSelling(true);
    try {
      await closeAccountPosition({ uid: user.uid, positionId: position.id, market, currentValue });
      window.dispatchEvent(new Event("thecard:order:placed"));
    } finally {
      setSelling(false);
    }
  }

  const activeOrderCount = orders
    ? [orders.takeProfit.enabled, orders.stopLoss.enabled, orders.autoBuy.enabled].filter(Boolean).length
    : 0;

  return (
    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-3.5 flex flex-col gap-2.5">

      {/* Toast */}
      {toast && (
        <div className="rounded-lg bg-[var(--color-card-accent-dim)] border border-[var(--color-card-accent)] px-3 py-2 text-xs font-semibold text-[var(--color-card-accent)]">
          🔔 {toast}
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center gap-3">
        <div className="rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wider shrink-0"
          style={{ color: sideColor, backgroundColor: `color-mix(in srgb, ${sideColor} 15%, transparent)` }}>
          {position.side}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[var(--color-card-text)] truncate">
            {market?.title ?? position.marketId}
          </p>
          <p className="text-[10px] text-[var(--color-card-muted)]">
            {position.contracts.toFixed(1)} contracts · avg {Math.round(position.averagePrice * 100)}¢
          </p>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-xs font-bold text-[var(--color-card-text)]">${currentValue.toFixed(2)}</span>
          <span className="text-[10px] font-semibold"
            style={{ color: pnlPositive ? "var(--color-card-yes)" : "var(--color-card-no)" }}>
            {pnlPositive ? "+" : ""}${pnl.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Value bar */}
      <div className="h-1 rounded-full bg-[var(--color-card-border)] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${currentCents}%`, backgroundColor: pnlPositive ? "var(--color-card-yes)" : "var(--color-card-no)" }} />
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between text-[10px] text-[var(--color-card-muted)]">
        <span>cost ${cost.toFixed(2)} · now {currentCents}¢</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowOrders((v) => !v)}
            className="px-3 py-1 rounded-md border border-[var(--color-card-border)] text-[var(--color-card-muted)] font-semibold hover:border-[var(--color-card-accent)] hover:text-[var(--color-card-accent)] transition-colors flex items-center gap-1">
            {showOrders ? "▾" : "▸"} Orders
            {activeOrderCount > 0 && (
              <span className="ml-0.5 rounded-full bg-[var(--color-card-accent)] text-white text-[9px] font-black w-3.5 h-3.5 flex items-center justify-center">
                {activeOrderCount}
              </span>
            )}
          </button>
          <button onClick={handleSell} disabled={selling}
            className="px-3 py-1 rounded-md border border-[var(--color-card-border)] text-[var(--color-card-text)] font-semibold hover:border-[var(--color-card-no)] hover:text-[var(--color-card-no)] transition-colors disabled:opacity-50">
            {selling ? "Selling…" : "Sell"}
          </button>
        </div>
      </div>

      {/* Orders panel */}
      {showOrders && orders && (
        <OrdersSection
          orders={orders}
          currentCents={currentCents}
          onChange={setOrders}
          onReset={() => { firedRef.current = { takeProfit: false, stopLoss: false, autoBuy: false }; }}
        />
      )}
    </div>
  );
}

// ── OrdersSection ──────────────────────────────────────────────────────────

function OrdersSection({ orders, currentCents, onChange, onReset }: {
  orders: LimitOrders;
  currentCents: number;
  onChange: (o: LimitOrders) => void;
  onReset: () => void;
}) {
  function setTP(patch: Partial<LimitOrder>) {
    onReset();
    onChange({ ...orders, takeProfit: { ...orders.takeProfit, ...patch } });
  }
  function setSL(patch: Partial<LimitOrder>) {
    onReset();
    onChange({ ...orders, stopLoss: { ...orders.stopLoss, ...patch } });
  }
  function setAB(patch: Partial<AutoBuyOrder>) {
    onReset();
    onChange({ ...orders, autoBuy: { ...orders.autoBuy, ...patch } });
  }

  return (
    <div className="flex flex-col gap-2 pt-1 border-t border-[var(--color-card-border)]">
      <p className="text-[10px] text-[var(--color-card-muted)] uppercase tracking-widest font-semibold pt-1">
        Conditional orders · session only
      </p>

      <OrderRow
        label="Take-profit"
        sublabel={`sell when above`}
        enabled={orders.takeProfit.enabled}
        onToggle={(v) => setTP({ enabled: v })}
        color="var(--color-card-yes)"
      >
        <PriceInput
          value={orders.takeProfit.price}
          min={currentCents + 1}
          max={99}
          onChange={(p) => setTP({ price: p })}
        />
        <span className="text-[10px] text-[var(--color-card-muted)]">¢ → auto-sell all</span>
      </OrderRow>

      <OrderRow
        label="Stop-loss"
        sublabel={`sell when below`}
        enabled={orders.stopLoss.enabled}
        onToggle={(v) => setSL({ enabled: v })}
        color="var(--color-card-no)"
      >
        <PriceInput
          value={orders.stopLoss.price}
          min={1}
          max={currentCents - 1}
          onChange={(p) => setSL({ price: p })}
        />
        <span className="text-[10px] text-[var(--color-card-muted)]">¢ → auto-sell all</span>
      </OrderRow>

      <OrderRow
        label="Buy more"
        sublabel={`add position when below`}
        enabled={orders.autoBuy.enabled}
        onToggle={(v) => setAB({ enabled: v })}
        color="var(--color-card-accent)"
      >
        <PriceInput
          value={orders.autoBuy.price}
          min={1}
          max={currentCents - 1}
          onChange={(p) => setAB({ price: p })}
        />
        <span className="text-[10px] text-[var(--color-card-muted)]">¢ · buy</span>
        <span className="text-[10px] text-[var(--color-card-muted)]">$</span>
        <input
          type="number" min={1} max={500} step={1}
          value={orders.autoBuy.amount}
          onChange={(e) => setAB({ amount: Math.max(1, parseInt(e.target.value) || 1) })}
          className="w-12 rounded-md border border-[var(--color-card-border)] bg-[var(--color-card-bg)] text-[var(--color-card-text)] text-xs font-semibold px-1.5 py-0.5 text-center focus:outline-none focus:border-[var(--color-card-accent)]"
        />
      </OrderRow>
    </div>
  );
}

// ── OrderRow ───────────────────────────────────────────────────────────────

function OrderRow({ label, sublabel, enabled, onToggle, color, children }: {
  label: string; sublabel: string; enabled: boolean;
  onToggle: (v: boolean) => void; color: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-lg border p-2.5 flex flex-col gap-2 transition-colors ${enabled ? "border-[var(--color-card-border)]" : "border-[var(--color-card-border)] opacity-60"}`}>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0">
          <span className="text-xs font-semibold" style={{ color }}>{label}</span>
          <span className="text-[10px] text-[var(--color-card-muted)]">{sublabel}</span>
        </div>
        <Toggle enabled={enabled} onChange={onToggle} color={color} />
      </div>
      {enabled && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Toggle ─────────────────────────────────────────────────────────────────

function Toggle({ enabled, onChange, color }: { enabled: boolean; onChange: (v: boolean) => void; color: string }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className="relative w-9 h-5 rounded-full transition-colors shrink-0"
      style={{ backgroundColor: enabled ? color : "var(--color-card-border)" }}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

// ── PriceInput ─────────────────────────────────────────────────────────────

function PriceInput({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      min={min} max={max} step={1}
      value={value}
      onChange={(e) => {
        const v = Math.min(max, Math.max(min, parseInt(e.target.value) || min));
        onChange(v);
      }}
      className="w-12 rounded-md border border-[var(--color-card-border)] bg-[var(--color-card-bg)] text-[var(--color-card-text)] text-xs font-semibold px-1.5 py-0.5 text-center focus:outline-none focus:border-[var(--color-card-accent)]"
    />
  );
}
