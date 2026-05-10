"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { SportLeague } from "@thecard/types";
import {
  SPORT_LEAGUES,
  getLeaguesByGroup,
  leagueTypeBadge,
  formatLeagueDateRange,
  getLeagueStatus,
} from "@/lib/sport-leagues";
import {
  isJoined,
  joinLeague,
  getLeagueBankroll,
  LEAGUE_BANKROLL_EVENT,
  STARTING_BANKROLL,
} from "@/lib/league-store";

// ── Joined leagues strip ─────────────────────────────────────────────────────

function YourLeagues() {
  const [joinedIds, setJoinedIds] = useState<string[]>([]);

  const refresh = useCallback(() => {
    setJoinedIds(SPORT_LEAGUES.filter((l) => isJoined(l.id)).map((l) => l.id));
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(LEAGUE_BANKROLL_EVENT, refresh);
    return () => window.removeEventListener(LEAGUE_BANKROLL_EVENT, refresh);
  }, [refresh]);

  if (joinedIds.length === 0) return null;

  const joined = SPORT_LEAGUES.filter((l) => joinedIds.includes(l.id));

  return (
    <div className="mb-8">
      <h2 className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest mb-3">
        Your Leagues
      </h2>
      <div className="flex flex-col gap-2">
        {joined.map((league) => (
          <JoinedLeagueRow key={league.id} league={league} />
        ))}
      </div>
    </div>
  );
}

function JoinedLeagueRow({ league }: { league: SportLeague }) {
  const [bankroll, setBankroll] = useState(() => getLeagueBankroll(league.id));
  const status = getLeagueStatus(league);
  const pnl = bankroll - STARTING_BANKROLL;
  const pnlColor = pnl >= 0 ? "var(--color-card-yes)" : "var(--color-card-no)";
  const pnlSign = pnl >= 0 ? "+" : "";

  useEffect(() => {
    const onUpdate = () => setBankroll(getLeagueBankroll(league.id));
    window.addEventListener(LEAGUE_BANKROLL_EVENT, onUpdate);
    return () => window.removeEventListener(LEAGUE_BANKROLL_EVENT, onUpdate);
  }, [league.id]);

  return (
    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-sm font-bold text-[var(--color-card-text)] truncate">{league.name}</p>
        <p className="text-[10px] text-[var(--color-text-muted)]">
          {leagueTypeBadge(league.type, league.half)}
          {" · "}
          <StatusPill status={status} />
        </p>
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

// ── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: "upcoming" | "active" | "closed" }) {
  if (status === "active") return <span className="text-[var(--color-card-yes)] font-semibold">Active</span>;
  if (status === "upcoming") return <span className="text-[var(--color-text-muted)]">Upcoming</span>;
  return <span className="text-[var(--color-card-no)]">Closed</span>;
}

// ── League row in the browse list ────────────────────────────────────────────

function LeagueRow({ league }: { league: SportLeague }) {
  const [joined, setJoined] = useState(() => isJoined(league.id));
  const [bankroll, setBankroll] = useState(() => getLeagueBankroll(league.id));
  const status = getLeagueStatus(league);

  useEffect(() => {
    const onUpdate = () => {
      setJoined(isJoined(league.id));
      setBankroll(getLeagueBankroll(league.id));
    };
    window.addEventListener(LEAGUE_BANKROLL_EVENT, onUpdate);
    return () => window.removeEventListener(LEAGUE_BANKROLL_EVENT, onUpdate);
  }, [league.id]);

  function handleJoin() {
    joinLeague(league.id);
    setJoined(true);
  }

  const badge = leagueTypeBadge(league.type, league.half);
  const badgeColor =
    league.type === "sport_playoffs" || league.type === "sport_tournament"
      ? "var(--color-card-yes)"
      : league.type === "sport_half_season"
      ? "#f59e0b"
      : "var(--color-brand-primary)";

  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-bold text-[var(--color-card-text)] truncate">{league.name}</p>
          <span
            className="text-[9px] font-black uppercase tracking-wider shrink-0 px-1.5 py-0.5 rounded-full"
            style={{ color: badgeColor, backgroundColor: `color-mix(in srgb, ${badgeColor} 15%, transparent)` }}
          >
            {badge}
          </span>
        </div>
        <p className="text-[10px] text-[var(--color-text-muted)]">
          {formatLeagueDateRange(league)}
          {" · "}
          {league.memberCount.toLocaleString()} players
        </p>
      </div>

      {joined ? (
        <div className="flex flex-col items-end shrink-0">
          <span className="text-xs font-black text-[var(--color-card-text)]">
            ${bankroll.toLocaleString()}
          </span>
          <span className="text-[9px] text-[var(--color-card-yes)] font-semibold">Joined ✓</span>
        </div>
      ) : status === "closed" ? (
        <span className="text-[10px] text-[var(--color-text-muted)] shrink-0">Closed</span>
      ) : (
        <button
          onClick={handleJoin}
          className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-brand-primary) 15%, transparent)",
            color: "var(--color-brand-primary)",
            border: "1px solid color-mix(in srgb, var(--color-brand-primary) 30%, transparent)",
          }}
        >
          Join · Free
        </button>
      )}
    </div>
  );
}

// ── Sport group ──────────────────────────────────────────────────────────────

function SportGroupSection({ group }: { group: ReturnType<typeof getLeaguesByGroup>[number] }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between mb-3"
      >
        <h2 className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest flex items-center gap-1.5">
          <span>{group.icon}</span>
          <span>{group.label}</span>
        </h2>
        <span className="text-xs text-[var(--color-text-muted)]">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] divide-y divide-[var(--color-card-border)]">
          {group.leagues.map((league) => (
            <LeagueRow key={league.id} league={league} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

export function LeaguesClient() {
  const groups = getLeaguesByGroup();

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] pt-8 pb-32">
      <div className="max-w-lg mx-auto px-4">

        <div className="mb-8">
          <Link href="/card" className="text-sm text-[var(--color-brand-primary)] hover:underline mb-4 inline-block">
            ← Back
          </Link>
          <h1 className="text-4xl font-display font-black mb-2">Leagues</h1>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            Each league is its own $1,000 bankroll. Join as many as you want &mdash; bets on matching markets count toward every league you&apos;re in. Grow it highest to win.
          </p>
        </div>

        <YourLeagues />

        <h2 className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest mb-5">
          Browse All Leagues
        </h2>

        {groups.map((group) => (
          <SportGroupSection key={group.sport} group={group} />
        ))}

        <div className="border-t border-[var(--color-card-border)] pt-6 pb-4 text-center">
          <p className="text-xs text-[var(--color-text-muted)]">
            All leagues are free to join. Each starts you with $1,000 in practice money.
          </p>
        </div>

      </div>
    </div>
  );
}
