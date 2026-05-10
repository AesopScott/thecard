"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { exchange } from "@/lib/exchange";
import { subscribeToPositions } from "@/lib/user-store";
import { isFirebaseConfigured } from "@/lib/firebase";
import type { Market, Position } from "@thecard/types";

export function PositionsPanel() {
  const { user } = useAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);

  useEffect(() => {
    exchange.getMarkets().then(setMarkets);
  }, []);

  useEffect(() => {
    if (!user) {
      setPositions([]);
      return;
    }

    if (isFirebaseConfigured) {
      return subscribeToPositions(user.uid, setPositions);
    }

    // Fallback: in-memory MockAdapter positions
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
        <h2 className="text-sm font-bold text-[var(--color-card-text)]">
          Your Positions
        </h2>
        <span className="text-xs text-[var(--color-card-muted)]">
          {positions.length} open
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {positions.map((pos, i) => (
          <PositionRow key={i} position={pos} markets={markets} />
        ))}
      </div>
    </div>
  );
}

function PositionRow({
  position,
  markets,
}: {
  position: Position;
  markets: Market[];
}) {
  const isYes = position.side === "yes";
  const sideColor = isYes ? "var(--color-card-yes)" : "var(--color-card-no)";
  const market = markets.find((m) => m.id === position.marketId);
  const cost = position.contracts * position.averagePrice;

  return (
    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-3.5 flex items-center gap-3">
      <div
        className="rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wider shrink-0"
        style={{
          color: sideColor,
          backgroundColor: `color-mix(in srgb, ${sideColor} 15%, transparent)`,
        }}
      >
        {position.side}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[var(--color-card-text)] truncate">
          {market?.title ?? position.marketId}
        </p>
        <p className="text-[10px] text-[var(--color-card-muted)]">
          {position.contracts.toFixed(1)} contracts · avg{" "}
          {Math.round(position.averagePrice * 100)}¢
        </p>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <span className="text-xs font-bold text-[var(--color-card-text)]">
          ${cost.toFixed(2)}
        </span>
        <span className="text-[10px] text-[var(--color-card-muted)]">cost</span>
      </div>
    </div>
  );
}
