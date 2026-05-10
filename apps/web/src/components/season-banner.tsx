"use client";

import { useEffect, useState } from "react";
import {
  ACTIVE_SEASON,
  GLOBAL_LEAGUE,
  SEASON_BANKROLL_EVENT,
  STARTING_BANKROLL,
  daysLeftInSeason,
  daysUntilSeason,
  getBankroll,
  getSeasonNumber,
  getSeasonStatus,
  initGlobalLeague,
} from "@/lib/season-store";

interface SeasonBannerProps {
  variant?: "compact" | "full";
}

export function SeasonBanner({ variant = "compact" }: SeasonBannerProps) {
  const [bankroll, setBankroll] = useState(STARTING_BANKROLL);

  useEffect(() => {
    initGlobalLeague();
    setBankroll(getBankroll(GLOBAL_LEAGUE.id));

    function onUpdate() {
      setBankroll(getBankroll(GLOBAL_LEAGUE.id));
    }
    window.addEventListener(SEASON_BANKROLL_EVENT, onUpdate);
    return () => window.removeEventListener(SEASON_BANKROLL_EVENT, onUpdate);
  }, []);

  const status = getSeasonStatus(ACTIVE_SEASON);
  const pnl = bankroll - STARTING_BANKROLL;
  const pnlColor = pnl >= 0 ? "var(--color-card-yes)" : "var(--color-card-no)";
  const pnlSign = pnl >= 0 ? "+" : "";

  if (variant === "compact") {
    return (
      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-2)] px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-[10px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest truncate">
            🏆 {ACTIVE_SEASON.name}
          </p>
          {status === "upcoming" && (
            <p className="text-xs text-[var(--color-text-muted)]">
              Opens in {daysUntilSeason(ACTIVE_SEASON)} days · ${STARTING_BANKROLL.toLocaleString()} starting bankroll
            </p>
          )}
          {status === "active" && (
            <p className="text-xs text-[var(--color-text-muted)]">
              {daysLeftInSeason(ACTIVE_SEASON)} days left · Prize pool ${ACTIVE_SEASON.prizePoolEstimate.toLocaleString()}+
            </p>
          )}
          {status === "closed" && (
            <p className="text-xs text-[var(--color-text-muted)]">Season ended</p>
          )}
        </div>

        <div className="flex flex-col items-end shrink-0">
          <span className="text-sm font-black text-[var(--color-card-text)]">
            ${bankroll.toLocaleString()}
          </span>
          {pnl !== 0 && (
            <span className="text-[10px] font-semibold" style={{ color: pnlColor }}>
              {pnlSign}${Math.abs(pnl).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Full variant — used on leaderboard page
  return (
    <div className="rounded-xl border border-[var(--color-brand-primary)]/30 bg-gradient-to-br from-[var(--color-surface-2)] to-[var(--color-background)] p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest">
            🏆 Season {getSeasonNumber(ACTIVE_SEASON)}
          </p>
          <p className="text-lg font-black text-[var(--color-card-text)] leading-tight">
            {ACTIVE_SEASON.name}
          </p>
        </div>
        <div className="flex flex-col items-end shrink-0">
          {status === "upcoming" && (
            <>
              <span className="text-2xl font-black text-[var(--color-card-text)]">
                {daysUntilSeason(ACTIVE_SEASON)}
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)]">days to open</span>
            </>
          )}
          {status === "active" && (
            <>
              <span className="text-2xl font-black text-[var(--color-card-text)]">
                {daysLeftInSeason(ACTIVE_SEASON)}
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)]">days left</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Your bankroll</span>
          <span className="text-base font-black text-[var(--color-card-text)]">
            ${bankroll.toLocaleString()}
          </span>
          {pnl !== 0 && (
            <span className="text-[10px] font-semibold" style={{ color: pnlColor }}>
              {pnlSign}${Math.abs(pnl).toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Prize pool</span>
          <span className="text-base font-black text-[var(--color-card-text)]">
            ${ACTIVE_SEASON.prizePoolEstimate.toLocaleString()}+
          </span>
          <span className="text-[10px] text-[var(--color-text-muted)]">top 10 split</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Players</span>
          <span className="text-base font-black text-[var(--color-card-text)]">
            {GLOBAL_LEAGUE.memberCount.toLocaleString()}
          </span>
          <span className="text-[10px] text-[var(--color-text-muted)]">in Global</span>
        </div>
      </div>

      {status === "upcoming" && (
        <div className="rounded-lg bg-[var(--color-brand-primary)]/10 border border-[var(--color-brand-primary)]/20 px-3 py-2">
          <p className="text-xs text-[var(--color-brand-primary)] font-semibold">
            Opens {ACTIVE_SEASON.startDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} — everyone starts with ${STARTING_BANKROLL.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
