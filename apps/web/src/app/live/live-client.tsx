"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
import { AskTheCardAi } from "@/components/ask-the-card-ai";
import { ExplainBetting } from "@/components/explain-betting";
import { EmailVerificationNotice } from "@/components/email-verification-notice";
import { PaneTitle } from "@/components/pane-title";
import { SignInSheet } from "@/components/sign-in-sheet";
import { ScoutFloaters } from "@/components/scout-mascot";
import {
  getStoredLiveRun,
  liveDateId,
  saveLiveRun,
  scoreLiveRun,
  subscribeLiveLeaderboard,
  type LiveLeaderboardEntry,
  type LivePick,
  type LivePickSide,
  type LiveRiskMode,
  type LiveRun,
} from "@/lib/live-store";

interface Game {
  id: string;
  away: string;
  awayScore: number;
  awayRecord: string;
  home: string;
  homeScore: number;
  homeRecord: string;
  period: string;
  clock: string;
  status: "live" | "upcoming" | "final";
}

interface MicroMarket {
  id: string;
  title: string;
  baseYes: number;
  openYes: number;
  trend: "up" | "down" | "flat";
  closesIn: string;
  tag: "drive" | "spread" | "total" | "prop";
}

interface TimelineItem {
  id: string;
  time: string;
  type: "odds" | "score" | "ticket" | "sweat";
  text: string;
  oddsRef?: string;
}

type BoardFilter = "today" | "slate" | "friends" | "verified" | "boosted" | "perfect";

const GAMES: Game[] = [
  { id: "kc-sf", away: "KC", awayScore: 17, awayRecord: "11-3", home: "SF", homeScore: 14, homeRecord: "10-4", period: "Q3", clock: "8:42", status: "live" },
  { id: "dal-phi", away: "DAL", awayScore: 0, awayRecord: "7-7", home: "PHI", homeScore: 0, homeRecord: "12-2", period: "pregame", clock: "8:20 PM", status: "upcoming" },
  { id: "buf-mia", away: "BUF", awayScore: 27, awayRecord: "11-3", home: "MIA", homeScore: 20, homeRecord: "8-6", period: "FINAL", clock: "", status: "final" },
];

const MICRO_MARKETS: MicroMarket[] = [
  { id: "main", title: "Chiefs to win", baseYes: 0.71, openYes: 0.62, trend: "up", closesIn: "game", tag: "spread" },
  { id: "mm1", title: "Next score: Chiefs TD", baseYes: 0.45, openYes: 0.33, trend: "up", closesIn: "2:34", tag: "drive" },
  { id: "mm2", title: "Chiefs win by 7+", baseYes: 0.38, openYes: 0.41, trend: "flat", closesIn: "game", tag: "spread" },
  { id: "mm3", title: "Total points over 47.5", baseYes: 0.61, openYes: 0.55, trend: "up", closesIn: "game", tag: "total" },
  { id: "mm4", title: "49ers cover +3.5", baseYes: 0.44, openYes: 0.52, trend: "down", closesIn: "game", tag: "prop" },
];

const BASE_TIMELINE: TimelineItem[] = [
  { id: "t1", time: "8:42 Q3", type: "odds", text: "Chiefs win price is climbing after a third-down conversion.", oddsRef: "71c YES" },
  { id: "t2", time: "8:20 Q3", type: "score", text: "Red-zone pressure is up. Next touchdown markets are moving fastest.", oddsRef: "TD +12c" },
  { id: "t3", time: "11:05 Q3", type: "sweat", text: "The total needs pace. Over backers need one more explosive drive.", oddsRef: "over 61c" },
  { id: "t4", time: "Halftime", type: "odds", text: "Chiefs opened the half at 64c before the first two drives split the market.", oddsRef: "64c YES" },
];

const LIVE_EXPLANATION = [
  {
    title: "What Live is",
    body: "Live is a fast ticket built while a game is in progress. Market prices can move as the game changes, so the goal is to spot a good read before the moment closes.",
  },
  {
    title: "Making picks",
    body: "Add up to five live calls to your ticket. Each pick records the side, the price, and the game moment. You can watch markets first, then decide which calls belong on the locked ticket.",
  },
  {
    title: "Risk and boost",
    body: "Your risk mode changes the final score multiplier: conservative is 0.8x, balanced is 1.0x, aggressive is 1.25x. You can also boost one pick so landing that read matters more.",
  },
  {
    title: "Locking and results",
    body: "You get one verified Live ticket per day. After lock, the ticket settles against the recorded outcomes, updates your score, and can feed into the Live board or an H2H challenge.",
  },
];

const LIVE_AI_SUGGESTIONS = [
  "When should I boost a pick?",
  "What does aggressive risk do?",
  "How should I use the watchlist?",
];

const STORAGE_KEY = "live_v1";
const HISTORY_KEY = "live_history_v1";
const WATCHLIST_KEY = "live_watchlist_v1";
const MAX_PICKS = 5;

function normalizeRun(run: LiveRun): LiveRun {
  return { ...run, ...scoreLiveRun(run.picks, run.outcomes, run.boostMarketId, run.riskMode ?? "balanced") };
}

function loadSavedRun(): LiveRun | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const run = JSON.parse(raw) as LiveRun;
    return run.date === liveDateId() ? normalizeRun(run) : null;
  } catch {
    return null;
  }
}

function loadHistory(): LiveRun[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const history = JSON.parse(raw) as LiveRun[];
    return Array.isArray(history) ? history.map(normalizeRun).slice(0, 10) : [];
  } catch {
    return [];
  }
}

function persistRun(run: LiveRun): void {
  if (typeof window === "undefined") return;
  const normalized = normalizeRun(run);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  const next = [normalized, ...loadHistory().filter((item) => item.date !== normalized.date)].slice(0, 10);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

function loadWatchlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function saveWatchlist(ids: string[]) {
  if (typeof window !== "undefined") localStorage.setItem(WATCHLIST_KEY, JSON.stringify(ids));
}

function timeUntilMidnight(): string {
  const now = new Date();
  const midnightUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const ms = midnightUtc.getTime() - now.getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

function shareText(run: LiveRun): string {
  const badge = run.perfectTicket ? "perfect ticket" : run.insuranceBadge ? "near-miss insurance" : run.isBust ? "bust" : `${run.streak}-pick streak`;
  return `I scored ${run.score} on today's Live Ticket at The Card (${run.correct}/${run.picks.length}, ${badge}).`;
}

function driftLabel(openYes: number, currentYes: number): string {
  const move = Math.round((currentYes - openYes) * 100);
  if (Math.abs(move) < 10) return `${move >= 0 ? "+" : ""}${move}c`;
  return `${move > 0 ? "+" : ""}${move}c alert`;
}

function statusForPick(pick: LivePick, boostMarketId: string | null): "Pending" | "Live" | "Settled" | "Busted" | "Boosted" {
  if (pick.marketId === boostMarketId) return "Boosted";
  if (pick.marketId === "mm1") return "Pending";
  if (pick.marketId === "mm4") return "Busted";
  if (pick.marketId === "main") return "Live";
  return "Settled";
}

function LivePulse() {
  const { t } = useI18n();
  return (
    <span className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-card-yes)] opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-card-yes)]" />
      </span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-card-yes)]">{t("live.live")}</span>
    </span>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-card-muted)]">{label}</p>
      <p className="mt-1 text-sm font-black text-[var(--color-card-text)]">{value}</p>
    </div>
  );
}

function GameChip({ game, selected, onClick }: { game: Game; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`min-w-[124px] flex-shrink-0 rounded-xl border p-3 text-left transition-colors ${selected ? "border-[var(--color-card-accent)] bg-[var(--color-card-accent-dim)]" : "border-[var(--color-card-border)] bg-[var(--color-card-surface)] hover:border-[var(--color-card-muted)]"}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-black text-[var(--color-card-text)]">{game.away}</span>
        <span className="text-xs font-black text-[var(--color-card-text)]">{game.awayScore}</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-xs font-black text-[var(--color-card-text)]">{game.home}</span>
        <span className="text-xs font-black text-[var(--color-card-text)]">{game.homeScore}</span>
      </div>
      <p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-[var(--color-card-muted)]">{game.status === "live" ? `${game.period} - ${game.clock}` : game.status}</p>
    </button>
  );
}

function Scoreboard({ game, momentum }: { game: Game; momentum: string }) {
  const { t } = useI18n();
  return (
    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
      <div className="flex items-center justify-between">
        <LivePulse />
        <span className="text-xs text-[var(--color-card-muted)]">{t("live.remaining", { period: game.period, clock: game.clock })}</span>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-center">
          <p className="text-3xl font-black text-[var(--color-card-text)]">{game.awayScore}</p>
          <p className="text-sm font-bold text-[var(--color-card-muted)]">{game.away}</p>
          <p className="text-[10px] text-[var(--color-card-muted)]">{game.awayRecord}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-[var(--color-card-muted)]">{t("live.momentum")}</p>
          <p className="mt-1 rounded-lg bg-[var(--color-card-accent-dim)] px-3 py-2 text-sm font-black text-[var(--color-card-accent)]">{momentum}</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-black text-[var(--color-card-text)]">{game.homeScore}</p>
          <p className="text-sm font-bold text-[var(--color-card-muted)]">{game.home}</p>
          <p className="text-[10px] text-[var(--color-card-muted)]">{game.homeRecord}</p>
        </div>
      </div>
    </div>
  );
}

function RiskSelector({ value, onChange, disabled }: { value: LiveRiskMode; onChange: (value: LiveRiskMode) => void; disabled: boolean }) {
  const { t } = useI18n();
  const riskDetails: Record<LiveRiskMode, { multiplier: string; title: string; body: string }> = {
    conservative: {
      multiplier: "0.8x",
      title: t("live.riskConservativeTitle"),
      body: t("live.riskConservativeBody"),
    },
    balanced: {
      multiplier: "1.0x",
      title: t("live.riskBalancedTitle"),
      body: t("live.riskBalancedBody"),
    },
    aggressive: {
      multiplier: "1.25x",
      title: t("live.riskAggressiveTitle"),
      body: t("live.riskAggressiveBody"),
    },
  };
  const selected = riskDetails[value];

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {(["conservative", "balanced", "aggressive"] as LiveRiskMode[]).map((mode) => (
          <button key={mode} disabled={disabled} onClick={() => onChange(mode)} aria-pressed={value === mode} className={`rounded-lg border px-2 py-2 text-[11px] font-black uppercase transition-all disabled:opacity-50 ${value === mode ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-white" : "border-[var(--color-card-border)] bg-[var(--color-card-bg)] text-[var(--color-card-muted)] hover:text-[var(--color-card-text)]"}`}>
            {mode}
          </button>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-black text-[var(--color-card-text)]">{selected.title}</p>
          <span className="rounded-md bg-[var(--color-card-surface)] px-2 py-1 text-[10px] font-black uppercase text-[var(--color-brand-primary)]">{t("live.scoreMultiplier", { multiplier: selected.multiplier })}</span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-[var(--color-card-muted)]">{selected.body}</p>
        {disabled && <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-card-muted)]">{t("live.lockedAfterFirstPick")}</p>}
      </div>
    </div>
  );
}

function BetButton({ side, cents, disabled, onPick }: { side: LivePickSide; cents: number; disabled: boolean; onPick: () => void }) {
  const isYes = side === "yes";
  const { t } = useI18n();
  return (
    <button onClick={onPick} disabled={disabled} className={`flex-1 rounded-lg border py-2.5 text-sm font-black transition-all disabled:cursor-not-allowed disabled:opacity-40 ${isYes ? "border-[var(--color-card-yes)] bg-[var(--color-card-yes-dim)] text-[var(--color-card-yes)] hover:bg-[var(--color-card-yes)] hover:text-white" : "border-[var(--color-card-no)] bg-[var(--color-card-no-dim)] text-[var(--color-card-no)] hover:bg-[var(--color-card-no)] hover:text-white"}`}>
      {isYes ? t("live.yes") : t("live.no")} - {cents}c
    </button>
  );
}

function MarketCard({
  market,
  yes,
  watched,
  disabled,
  onPick,
  onWatch,
}: {
  market: MicroMarket;
  yes: number;
  watched: boolean;
  disabled: boolean;
  onPick: (pick: LivePick) => void;
  onWatch: () => void;
}) {
  const { t } = useI18n();
  const yesPct = Math.round(yes * 100);
  const move = driftLabel(market.openYes, yes);
  const closingSoon = market.closesIn !== "game";
  return (
    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[var(--color-card-bg)] px-2 py-1 text-[10px] font-black uppercase text-[var(--color-card-muted)]">{market.tag}</span>
            <span className={`rounded-md px-2 py-1 text-[10px] font-black uppercase ${Math.abs(Math.round((yes - market.openYes) * 100)) >= 10 ? "bg-[var(--color-brand-primary)] text-white" : "bg-[var(--color-card-bg)] text-[var(--color-card-muted)]"}`}>{move}</span>
            {closingSoon && <span className="rounded-md bg-[var(--color-card-no-dim)] px-2 py-1 text-[10px] font-black uppercase text-[var(--color-card-no)]">{t("live.closingIn", { time: market.closesIn })}</span>}
          </div>
          <p className="mt-2 text-sm font-semibold leading-snug text-[var(--color-card-text)]">{market.title}</p>
        </div>
        <button onClick={onWatch} className={`h-9 w-9 rounded-lg border text-sm font-black ${watched ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-white" : "border-[var(--color-card-border)] text-[var(--color-card-muted)]"}`} title={t("live.watchMarket")}>
          *
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-card-border)]">
          <div className="h-full rounded-full bg-[var(--color-card-yes)] transition-all duration-1000" style={{ width: `${yesPct}%` }} />
        </div>
        <span className="w-10 text-right text-xs font-bold text-[var(--color-card-text)]">{yesPct}c</span>
      </div>
      <div className="mt-3 flex gap-2">
        <BetButton side="yes" cents={yesPct} disabled={disabled} onPick={() => onPick({ marketId: market.id, title: market.title, side: "yes", price: yesPct, openedAt: market.openYes * 100, currentPrice: yesPct })} />
        <BetButton side="no" cents={100 - yesPct} disabled={disabled} onPick={() => onPick({ marketId: market.id, title: market.title, side: "no", price: 100 - yesPct, openedAt: (1 - market.openYes) * 100, currentPrice: 100 - yesPct })} />
      </div>
    </div>
  );
}

function LiveTimeline({ items, picks }: { items: TimelineItem[]; picks: LivePick[] }) {
  const { t } = useI18n();
  const ticketItems: TimelineItem[] = picks.slice(-2).map((pick, index) => ({
    id: `pick-${pick.marketId}-${index}`,
    time: "now",
    type: "ticket",
    text: t("live.addedToTicket", { side: pick.side.toUpperCase(), title: pick.title }),
    oddsRef: `${pick.price}c`,
  }));
  return (
    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
      <div className="flex items-center justify-between">
        <PaneTitle en="Live feed of ticket actions and game context during the slate." es="Flujo en vivo de acciones del boleto y contexto de los partidos durante la cartelera.">{t("live.sweatTimeline")}</PaneTitle>
        <LivePulse />
      </div>
      <div className="mt-3 flex flex-col gap-3">
        {[...ticketItems, ...items].slice(0, 6).map((item) => (
          <div key={item.id} className="rounded-lg bg-[var(--color-card-bg)] px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-card-accent)]">{item.time}</span>
              {item.oddsRef && <span className="text-[10px] text-[var(--color-card-muted)]">{item.oddsRef}</span>}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-card-text)]">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActiveTicket({
  picks,
  savedRun,
  boostMarketId,
  riskMode,
  cashOut,
  saving,
  error,
  onBoost,
  onSwap,
  onCashOut,
  onLock,
  onClear,
}: {
  picks: LivePick[];
  savedRun: LiveRun | null;
  boostMarketId: string | null;
  riskMode: LiveRiskMode;
  cashOut: boolean;
  saving: boolean;
  error: string | null;
  onBoost: (id: string) => void;
  onSwap: (id: string) => void;
  onCashOut: () => void;
  onLock: () => void;
  onClear: () => void;
}) {
  const { t } = useI18n();
  const preview = scoreLiveRun(picks, undefined, boostMarketId, riskMode);
  const bustRisk = picks.length === 0 ? "low" : riskMode === "aggressive" ? "high" : picks.length >= 4 ? "medium" : "low";

  if (savedRun) {
    return (
      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
        <div className="flex items-center justify-between">
          <PaneTitle en="Shows the saved run and when a new ticket opens." es="Muestra la jugada guardada y cuando se abre un boleto nuevo.">{t("live.locked")}</PaneTitle>
          <p className="text-sm font-black text-[var(--color-card-text)]">{savedRun.score} pts</p>
        </div>
        <p className="mt-2 text-xs text-[var(--color-card-muted)]">{savedRun.correct}/{savedRun.picks.length} settled. Next live ticket in {timeUntilMidnight()}.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
      <div className="flex items-center justify-between">
        <PaneTitle en="Your current live picks, boost, late swap, and lock controls." es="Tus picks en vivo, impulso, cambio tardio y controles para bloquear.">{t("live.activeTicket")}</PaneTitle>
        <p className="text-xs font-bold text-[var(--color-card-muted)]">{picks.length}/{MAX_PICKS}</p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <StatPill label={t("card.preview")} value={preview.score} />
        <StatPill label={t("live.streak")} value={preview.streak} />
        <StatPill label={t("live.bustRisk")} value={bustRisk} />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {picks.length === 0 ? (
          <p className="text-sm text-[var(--color-card-muted)]">{t("live.addCalls")}</p>
        ) : picks.map((pick) => (
          <div key={pick.marketId} className="rounded-lg bg-[var(--color-card-bg)] px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-xs font-semibold text-[var(--color-card-text)]">{pick.title}</p>
              <span className={`text-xs font-black ${pick.side === "yes" ? "text-[var(--color-card-yes)]" : "text-[var(--color-card-no)]"}`}>{pick.side.toUpperCase()} {pick.price}c</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-md bg-[var(--color-card-surface)] px-2 py-1 text-[10px] font-black uppercase text-[var(--color-card-muted)]">{t(`live.status.${statusForPick(pick, boostMarketId).toLowerCase()}` as Parameters<typeof t>[0])}</span>
              <button onClick={() => onBoost(pick.marketId)} className="text-[10px] font-black uppercase text-[var(--color-brand-primary)]">{boostMarketId === pick.marketId ? t("live.boosted") : t("live.boost")}</button>
              <button onClick={() => onSwap(pick.marketId)} className="text-[10px] font-black uppercase text-[var(--color-card-muted)]">{t("live.lateSwap")}</button>
            </div>
          </div>
        ))}
      </div>
      {cashOut && picks.length > 0 && (
        <button onClick={onCashOut} className="mt-3 w-full rounded-lg border border-[var(--color-card-yes)] bg-[var(--color-card-yes-dim)] py-3 text-xs font-black uppercase text-[var(--color-card-yes)]">
          {t("live.cashOut")}
        </button>
      )}
      <div className="mt-3 flex gap-2">
        <button onClick={onLock} disabled={picks.length === 0 || saving} className="flex-1 rounded-lg bg-[var(--color-brand-primary)] px-3 py-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? t("live.locking") : t("live.lockTicket")}
        </button>
        <button onClick={onClear} disabled={picks.length === 0 || saving} className="rounded-lg border border-[var(--color-card-border)] px-3 py-3 text-xs font-bold text-[var(--color-card-muted)] disabled:opacity-50">
          {t("live.clearTicket")}
        </button>
      </div>
      {error && <p className="mt-3 rounded-lg border border-[var(--color-card-no)]/30 px-3 py-2 text-xs text-[var(--color-card-no)]">{error}</p>}
    </div>
  );
}

function LiveLeaderboard({ entries, userId, loading, error }: { entries: LiveLeaderboardEntry[]; userId: string | null; loading: boolean; error: string | null }) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<BoardFilter>("today");
  const filtered = entries.filter((entry) => {
    if (filter === "friends") return userId ? entry.uid === userId : false;
    if (filter === "boosted") return entry.boostedCorrect;
    if (filter === "perfect") return entry.perfectTicket;
    return true;
  });
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--color-card-border)] px-4 py-3">
        <PaneTitle en="Ranks verified live tickets for this slate." es="Clasifica boletos en vivo verificados para esta cartelera.">{t("live.board")}</PaneTitle>
        <span className="text-xs font-bold text-[var(--color-card-muted)]">{entries.length} {t("live.reads")}</span>
      </div>
      <div className="flex gap-2 overflow-x-auto border-b border-[var(--color-card-border)] px-4 py-3">
        {(["today", "slate", "friends", "verified", "boosted", "perfect"] as BoardFilter[]).map((item) => (
          <button key={item} onClick={() => setFilter(item)} className={`rounded-lg px-3 py-1.5 text-xs font-black uppercase transition-all ${filter === item ? "bg-[var(--color-brand-primary)] text-white" : "bg-[var(--color-card-bg)] text-[var(--color-card-muted)] hover:text-[var(--color-card-text)]"}`}>{item}</button>
        ))}
      </div>
      {loading ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm font-black text-[var(--color-card-text)]">{t("live.loadingBoard")}</p>
          <p className="mt-1 text-xs text-[var(--color-card-muted)]">{t("live.verifiedOnly")}</p>
        </div>
      ) : error ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm font-black text-[var(--color-card-text)]">{t("live.couldNotLoadBoard")}</p>
          <p className="mt-1 text-xs text-[var(--color-card-muted)]">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm font-black text-[var(--color-card-text)]">{t("live.noTickets")}</p>
          <p className="mt-1 text-xs text-[var(--color-card-muted)]">{filter === "today" || filter === "verified" ? t("live.firstTicket") : t("live.noFilterMatches")}</p>
        </div>
      ) : filtered.slice(0, 8).map((entry, index) => {
        const isYou = userId === entry.uid;
        const name = entry.username ? <Link href={`/profile?u=${encodeURIComponent(entry.username)}`} className="hover:text-[var(--color-brand-primary)]">{entry.displayName}</Link> : entry.displayName;
        return (
          <div key={entry.uid} className={`grid grid-cols-[28px_32px_1fr_54px] items-center gap-2 border-b border-[var(--color-card-border)] px-4 py-3 last:border-0 ${isYou ? "bg-[var(--color-brand-primary)]/10" : ""}`}>
            <span className="text-right text-xs font-black text-[var(--color-card-muted)]">{index + 1}</span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-card-accent-dim)] text-xs font-black text-[var(--color-card-accent)]">{entry.displayName.slice(0, 1).toUpperCase()}</span>
            <div className="min-w-0">
              <p className={`truncate text-sm font-bold ${isYou ? "text-[var(--color-brand-primary)]" : "text-[var(--color-card-text)]"}`}>{name}{isYou ? t("live.youSuffix") : ""}</p>
              <p className="text-[10px] text-[var(--color-card-muted)]">{t("live.rowDetail", { correct: String(entry.correct), total: String(entry.pickCount), streak: String(entry.streak) })}{entry.perfectTicket ? t("live.perfectSuffix") : ""}</p>
            </div>
            <span className="text-right text-sm font-black text-[var(--color-card-text)]">{entry.score}</span>
          </div>
        );
      })}
    </div>
  );
}

function LiveResults({ run, leaderboard, userId, leaderboardLoading, leaderboardError, shareStatus, onShare, onH2H }: { run: LiveRun; leaderboard: LiveLeaderboardEntry[]; userId: string | null; leaderboardLoading: boolean; leaderboardError: string | null; shareStatus: string | null; onShare: () => void; onH2H: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5">
        <PaneTitle en="Your completed live result formatted for sharing." es="Tu resultado en vivo terminado, formateado para compartir.">{t("live.ticketShareCard")}</PaneTitle>
        <div className="mt-3 rounded-xl bg-[var(--color-card-bg)] p-5">
          <p className="text-sm font-black text-[var(--color-card-text)]">{t("live.liveTicket")}</p>
          <p className="mt-2 text-6xl font-black text-[var(--color-brand-primary)]">{run.score}</p>
          <p className="text-sm text-[var(--color-card-muted)]">{t("live.resultLine", { correct: String(run.correct), total: String(run.picks.length), streak: String(run.streak) })}</p>
          <p className="mt-3 text-xs text-[var(--color-card-muted)]">{run.perfectTicket ? t("live.perfectTicket") : run.insuranceBadge ? t("live.insuranceBadge") : run.isBust ? t("live.ticketBusted") : run.boostedCorrect ? t("live.boostLanded") : t("live.solidSweat")}</p>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)]">
        {run.picks.map((pick) => {
          const outcome = run.outcomes[pick.marketId]!;
          const correct = pick.side === outcome;
          return (
            <div key={pick.marketId} className="border-b border-[var(--color-card-border)] px-4 py-3 last:border-0">
              <div className="flex items-center gap-3">
                <span className={`w-5 text-lg font-black ${correct ? "text-[var(--color-card-yes)]" : "text-[var(--color-card-no)]"}`}>{correct ? "Y" : "N"}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--color-card-text)]">{pick.title}</p>
                  <p className="text-xs text-[var(--color-card-muted)]">{t("live.pickResultLine", { side: pick.side.toUpperCase(), outcome: outcome.toUpperCase(), price: String(pick.price) })}</p>
                </div>
                <span className="rounded-md bg-[var(--color-card-bg)] px-2 py-1 text-[10px] font-black uppercase text-[var(--color-card-muted)]">{t(`live.status.${statusForPick(pick, run.boostMarketId ?? null).toLowerCase()}` as Parameters<typeof t>[0])}</span>
              </div>
              <p className="mt-2 text-xs text-[var(--color-card-muted)]">{t("live.replayLine", { outcome: outcome.toUpperCase() })}</p>
            </div>
          );
        })}
      </div>
      <LiveLeaderboard entries={leaderboard} userId={userId} loading={leaderboardLoading} error={leaderboardError} />
      <div className="grid gap-3 sm:grid-cols-3">
        <button onClick={onShare} className="rounded-xl bg-[var(--color-surface-2)] py-4 text-base font-black text-[var(--color-text-primary)]">{t("h2h.shareResult")}</button>
        <button onClick={onH2H} className="rounded-xl bg-[var(--color-brand-primary)] py-4 text-base font-black text-white">{t("blitz.challengeH2H")}</button>
        <Link href="/card" className="rounded-xl border border-[var(--color-card-border)] py-4 text-center text-sm font-bold text-[var(--color-card-muted)]">{t("h2h.fullCard")}</Link>
      </div>
      {shareStatus && <p className="text-center text-xs font-semibold text-[var(--color-card-yes)]">{shareStatus}</p>}
    </div>
  );
}

export function LiveClient() {
  const { user, verificationRequired } = useAuth();
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState("kc-sf");
  const [marketYes, setMarketYes] = useState(MICRO_MARKETS.map((market) => market.baseYes));
  const [picks, setPicks] = useState<LivePick[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [boostMarketId, setBoostMarketId] = useState<string | null>(null);
  const [riskMode, setRiskMode] = useState<LiveRiskMode>("balanced");
  const [swapUsed, setSwapUsed] = useState(false);
  const [cashOut, setCashOut] = useState(true);
  const [savedRun, setSavedRun] = useState<LiveRun | null>(null);
  const [history, setHistory] = useState<LiveRun[]>([]);
  const [leaderboard, setLeaderboard] = useState<LiveLeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [chatPrompt, setChatPrompt] = useState<string | null>(null);

  useEffect(() => {
    const local = loadSavedRun();
    if (local) setSavedRun(local);
    setHistory(loadHistory());
    setWatchlist(loadWatchlist());
  }, []);

  useEffect(() => subscribeLiveLeaderboard(liveDateId(), (entries) => {
    setLeaderboard(entries);
    setLeaderboardLoading(false);
    setLeaderboardError(null);
  }, () => {
    setLeaderboardLoading(false);
    setLeaderboardError("Refresh the page or try again after live tickets land.");
  }), []);

  useEffect(() => {
    if (!user || verificationRequired) return;
    getStoredLiveRun(user.uid)
      .then((run) => {
        if (!run) return;
        persistRun(run);
        setSavedRun(run);
        setHistory(loadHistory());
      })
      .catch(() => setSaveError("Could not load today's Live Ticket."));
  }, [user, verificationRequired]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMarketYes((current) => current.map((yes, index) => {
        const market = MICRO_MARKETS[index]!;
        const bias = market.trend === "up" ? 0.004 : market.trend === "down" ? -0.004 : 0;
        return Math.min(0.92, Math.max(0.08, yes + (Math.random() - 0.5) * 0.018 + bias));
      }));
    }, 2200);
    return () => window.clearInterval(interval);
  }, []);

  const selected = GAMES.find((game) => game.id === selectedId) ?? GAMES[0]!;
  const isLiveGame = selected.status === "live";
  const picksDisabled = !user || verificationRequired || Boolean(savedRun) || picks.length >= MAX_PICKS;
  const momentum = useMemo(() => {
    const rising = marketYes.filter((yes, index) => yes > MICRO_MARKETS[index]!.openYes).length;
    if (rising >= 4) return "Heating up";
    if (rising <= 1) return "Cooling off";
    return "Balanced";
  }, [marketYes]);
  const smartNext = MICRO_MARKETS.find((market) => !picks.some((pick) => pick.marketId === market.id) && watchlist.includes(market.id)) ?? MICRO_MARKETS.find((market) => !picks.some((pick) => pick.marketId === market.id));

  function toggleWatch(id: string) {
    setWatchlist((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      saveWatchlist(next);
      return next;
    });
  }

  function handlePick(pick: LivePick) {
    if (!user) {
      setSignInOpen(true);
      return;
    }
    if (picksDisabled) return;
    setPicks((current) => {
      if (current.length >= MAX_PICKS || current.some((existing) => existing.marketId === pick.marketId)) return current;
      return [...current, pick];
    });
  }

  function lateSwap(id: string) {
    if (swapUsed || savedRun) return;
    setPicks((current) => current.filter((pick) => pick.marketId !== id));
    setSwapUsed(true);
  }

  async function lockLiveTicket() {
    if (!user) {
      setSignInOpen(true);
      return;
    }
    if (verificationRequired || saving || savedRun || picks.length === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      const run = await saveLiveRun(user.uid, selected.id, picks, {
        displayName: user.displayName || user.email?.split("@")[0] || "You",
        photoURL: user.photoURL,
      }, liveDateId(), { boostMarketId, riskMode });
      persistRun(run);
      setSavedRun(run);
      setHistory(loadHistory());
    } catch {
      setSaveError("Your Live Ticket could not be saved. Try locking it again.");
    } finally {
      setSaving(false);
    }
  }

  async function shareResult() {
    if (!savedRun) return;
    const text = shareText(savedRun);
    const url = typeof window !== "undefined" ? `${window.location.origin}/live` : "https://thecard.bet/live";
    setShareStatus(null);
    try {
      if (navigator.share) {
        await navigator.share({ title: "The Card Live Ticket", text, url });
        setShareStatus("Shared.");
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setShareStatus("Copied to clipboard.");
    } catch {
      setShareStatus("Share canceled.");
    }
  }

  function challengeH2H() {
    if (!savedRun || typeof window === "undefined") return;
    window.location.href = `/h2h?challenge=${savedRun.score}`;
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6 pb-24">
      <ScoutFloaters page="live" />
      <header className="grid gap-3 md:grid-cols-[1fr_320px]">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--color-card-text)]">{t("live.title")}</h1>
          <p className="mt-1 text-sm text-[var(--color-card-muted)]">{t("live.subtitle")}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <StatPill label={t("live.history")} value={history.length} />
          <StatPill label={t("live.swap")} value={swapUsed ? "used" : "ready"} />
          <StatPill label={t("live.watchlist")} value={watchlist.length} />
        </div>
      </header>

      <ExplainBetting
        buttonLabel={t("live.explainButton")}
        title={t("live.explainTitle")}
        summary={t("live.explainSummary")}
        sections={LIVE_EXPLANATION}
      />

      <AskTheCardAi
        mode="live"
        context="On this page, watch prices move during the live game, add up to five calls, choose risk before committing, optionally boost one pick, then lock one verified ticket."
        suggestions={LIVE_AI_SUGGESTIONS}
      />

      {!user && (
        <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 text-center">
          <p className="text-sm font-bold text-[var(--color-card-text)]">{t("live.signInTitle")}</p>
          <p className="mt-1 text-xs text-[var(--color-card-muted)]">{t("live.signInBody")}</p>
          <button onClick={() => setSignInOpen(true)} className="mt-3 rounded-lg bg-[var(--color-brand-primary)] px-4 py-2 text-xs font-bold text-white">{t("account.signIn")}</button>
        </div>
      )}
      {user && verificationRequired && <EmailVerificationNotice compact />}

      {savedRun ? (
        <LiveResults run={savedRun} leaderboard={leaderboard} userId={user?.uid ?? null} leaderboardLoading={leaderboardLoading} leaderboardError={leaderboardError} shareStatus={shareStatus} onShare={shareResult} onH2H={challengeH2H} />
      ) : (
        <>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {GAMES.map((game) => <GameChip key={game.id} game={game} selected={game.id === selectedId} onClick={() => setSelectedId(game.id)} />)}
          </div>
          {isLiveGame ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <div className="flex flex-col gap-4">
                <Scoreboard game={selected} momentum={momentum} />
                <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
                  <div className="flex items-center justify-between">
                    <PaneTitle en="Choose the score and risk profile before locking the first live pick." es="Elige el perfil de puntaje y riesgo antes de bloquear el primer pick en vivo.">{t("live.riskSlider")}</PaneTitle>
                    <p className="text-xs text-[var(--color-card-muted)]">{t("live.chooseBeforeLock")}</p>
                  </div>
                  <div className="mt-3"><RiskSelector value={riskMode} onChange={setRiskMode} disabled={picks.length > 0} /></div>
                </div>
                <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
                  <PaneTitle en="Suggests the next market based on watchlist and ticket room." es="Sugiere el siguiente mercado segun tu lista de seguimiento y el espacio del boleto.">{t("live.smartNext")}</PaneTitle>
                  <p className="mt-2 text-sm text-[var(--color-card-text)]">{smartNext ? smartNext.title : t("live.ticketFull")}</p>
                  <p className="mt-1 text-xs text-[var(--color-card-muted)]">{t("live.smartNextHelp")}</p>
                </div>
                <div className="flex flex-col gap-3">
                  {MICRO_MARKETS.map((market, index) => (
                    <MarketCard key={market.id} market={market} yes={marketYes[index]!} watched={watchlist.includes(market.id)} disabled={picksDisabled || picks.some((pick) => pick.marketId === market.id)} onPick={handlePick} onWatch={() => toggleWatch(market.id)} />
                  ))}
                </div>
              </div>
              <aside className="flex flex-col gap-4">
                <ActiveTicket picks={picks} savedRun={savedRun} boostMarketId={boostMarketId} riskMode={riskMode} cashOut={cashOut} saving={saving} error={saveError} onBoost={(id) => setBoostMarketId((current) => current === id ? null : id)} onSwap={lateSwap} onCashOut={() => setCashOut(false)} onLock={lockLiveTicket} onClear={() => { setPicks([]); setBoostMarketId(null); }} />
                <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
                  <PaneTitle en="Quick reaction lines for the live sweat room." es="Frases rapidas de reaccion para la sala en vivo.">{t("live.sweatPrompts")}</PaneTitle>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {["hold", "bad beat", "lock it", "need one more"].map((line) => (
                      <button key={line} onClick={() => setChatPrompt(line)} className="rounded-lg border border-[var(--color-card-border)] px-3 py-2 text-xs font-bold text-[var(--color-card-muted)] hover:text-[var(--color-card-text)]">{line}</button>
                    ))}
                  </div>
                  {chatPrompt && <p className="mt-3 rounded-lg bg-[var(--color-card-bg)] px-3 py-2 text-sm font-bold text-[var(--color-card-text)]">{chatPrompt}</p>}
                </div>
                <LiveTimeline items={BASE_TIMELINE} picks={picks} />
                <LiveLeaderboard entries={leaderboard} userId={user?.uid ?? null} loading={leaderboardLoading} error={leaderboardError} />
              </aside>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5">
              <p className="text-sm font-semibold text-[var(--color-card-text)]">{selected.status === "upcoming" ? `${selected.away} vs ${selected.home} - ${selected.clock}` : `${selected.away} ${selected.awayScore} - ${selected.home} ${selected.homeScore} - Final`}</p>
              <p className="mt-1 text-xs text-[var(--color-card-muted)]">{selected.status === "upcoming" ? "Live mode activates when the game kicks off." : "This game has ended. Pick a live game above to see real-time markets."}</p>
            </div>
          )}
        </>
      )}
      <SignInSheet open={signInOpen} onClose={() => setSignInOpen(false)} />
    </div>
  );
}
