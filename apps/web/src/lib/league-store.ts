import type { LeagueMembership, Sport } from "@thecard/types";
import { collection, doc, getDoc, getDocs, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";
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

function fromFirestore(leagueId: string, data: Record<string, unknown>): LeagueMembership {
  return {
    leagueId,
    seasonId: (data.seasonId as string | undefined) ?? leagueId,
    startingBankroll: (data.startingBankroll as number | undefined) ?? STARTING_BANKROLL,
    currentBankroll: (data.currentBankroll as number | undefined) ?? STARTING_BANKROLL,
    betCount: (data.betCount as number | undefined) ?? 0,
    isBust: (data.isBust as boolean | undefined) ?? false,
    joinedAt: (data.joinedAtMs as number | undefined) ?? (data.joinedAt as number | undefined) ?? Date.now(),
  };
}

function writeCache(m: LeagueMembership): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key(m.leagueId), JSON.stringify(m));
}

function dispatchLeagueEvent(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(LEAGUE_BANKROLL_EVENT));
}

export async function getUserLeagueMembership(uid: string, leagueId: string): Promise<LeagueMembership | null> {
  if (!db) return read(leagueId);
  const snap = await getDoc(doc(db, "users", uid, "leagueMemberships", leagueId));
  if (!snap.exists()) return null;
  const membership = fromFirestore(leagueId, snap.data());
  writeCache(membership);
  return membership;
}

export async function getUserLeagueMemberships(uid: string): Promise<LeagueMembership[]> {
  if (!db) return getAllJoinedLeagueIds().map((leagueId) => read(leagueId)).filter((m): m is LeagueMembership => Boolean(m));
  const snap = await getDocs(collection(db, "users", uid, "leagueMemberships"));
  const memberships = snap.docs.map((membershipDoc) => fromFirestore(membershipDoc.id, membershipDoc.data()));
  memberships.forEach(writeCache);
  return memberships;
}

export async function joinUserLeague(uid: string, leagueId: string): Promise<LeagueMembership> {
  const existing = await getUserLeagueMembership(uid, leagueId);
  if (existing) return existing;
  const membership: LeagueMembership = {
    leagueId,
    seasonId: leagueId,
    startingBankroll: STARTING_BANKROLL,
    currentBankroll: STARTING_BANKROLL,
    betCount: 0,
    isBust: false,
    joinedAt: Date.now(),
  };
  if (db) {
    await setDoc(doc(db, "users", uid, "leagueMemberships", leagueId), {
      ...membership,
      joinedAtMs: membership.joinedAt,
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  writeCache(membership);
  dispatchLeagueEvent();
  return membership;
}

export async function placeUserLeagueBet(uid: string, leagueId: string, amount: number): Promise<boolean> {
  if (!db) return placeLeagueBet(leagueId, amount);
  const ref = doc(db, "users", uid, "leagueMemberships", leagueId);
  const updated = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return null;
    const membership = fromFirestore(leagueId, snap.data());
    if (membership.isBust || membership.currentBankroll < amount) return null;
    const newBankroll = Math.max(0, membership.currentBankroll - amount);
    const next: LeagueMembership = {
      ...membership,
      currentBankroll: newBankroll,
      betCount: membership.betCount + 1,
      isBust: newBankroll <= 0,
    };
    tx.update(ref, {
      currentBankroll: next.currentBankroll,
      betCount: next.betCount,
      isBust: next.isBust,
      updatedAt: serverTimestamp(),
    });
    return next;
  });
  if (!updated) return false;
  writeCache(updated);
  dispatchLeagueEvent();
  return true;
}

export async function getActiveJoinedLeaguesForSportForUser(uid: string, sport: Sport): Promise<string[]> {
  const memberships = await getUserLeagueMemberships(uid);
  const joined = new Set(memberships.map((membership) => membership.leagueId));
  return SPORT_LEAGUES.filter(
    (league) => league.sport === sport && joined.has(league.id) && getLeagueStatus(league) === "active",
  ).map((league) => league.id);
}
