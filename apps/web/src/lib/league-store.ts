import type { LeagueMembership, Sport } from "@thecard/types";
import { SPORT_LEAGUES, getLeagueStatus } from "./sport-leagues";

export const STARTING_BANKROLL = 1_000;
export const LEAGUE_BANKROLL_EVENT = "thecard:league:bankroll";

const PREFIX = "thecard:league:v1:";

function key(leagueId: string): string {
  return `${PREFIX}${leagueId}`;
}

function read(leagueId: string): LeagueMembership | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key(leagueId));
    return raw ? (JSON.parse(raw) as LeagueMembership) : null;
  } catch {
    return null;
  }
}

function write(m: LeagueMembership): void {
  localStorage.setItem(key(m.leagueId), JSON.stringify(m));
  window.dispatchEvent(new Event(LEAGUE_BANKROLL_EVENT));
}

export function isJoined(leagueId: string): boolean {
  return read(leagueId) !== null;
}

export function joinLeague(leagueId: string): LeagueMembership {
  const existing = read(leagueId);
  if (existing) return existing;
  const m: LeagueMembership = {
    leagueId,
    seasonId: leagueId,
    startingBankroll: STARTING_BANKROLL,
    currentBankroll: STARTING_BANKROLL,
    betCount: 0,
    isBust: false,
    joinedAt: Date.now(),
  };
  write(m);
  return m;
}

export function getLeagueMembership(leagueId: string): LeagueMembership | null {
  return read(leagueId);
}

export function getLeagueBankroll(leagueId: string): number {
  return read(leagueId)?.currentBankroll ?? STARTING_BANKROLL;
}

export function placeLeagueBet(leagueId: string, amount: number): boolean {
  const m = read(leagueId);
  if (!m || m.isBust || m.currentBankroll < amount) return false;
  const newBankroll = Math.max(0, m.currentBankroll - amount);
  write({ ...m, currentBankroll: newBankroll, betCount: m.betCount + 1, isBust: newBankroll <= 0 });
  return true;
}

export function recordLeaguePayout(leagueId: string, payout: number): void {
  const m = read(leagueId);
  if (!m) return;
  write({ ...m, currentBankroll: m.currentBankroll + payout });
}

// Returns all currently-active sport leagues that the user has joined for a given sport.
// Used by order-sheet to know which leagues to also deduct from when a bet is placed.
export function getActiveJoinedLeaguesForSport(sport: Sport): string[] {
  return SPORT_LEAGUES.filter(
    (l) => l.sport === sport && isJoined(l.id) && getLeagueStatus(l) === "active",
  ).map((l) => l.id);
}

// All league IDs the user has joined (any status), for display purposes.
export function getAllJoinedLeagueIds(): string[] {
  if (typeof window === "undefined") return [];
  return SPORT_LEAGUES.filter((l) => isJoined(l.id)).map((l) => l.id);
}
