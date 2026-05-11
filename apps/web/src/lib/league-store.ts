import type { LeagueMembership, Sport } from "@thecard/types";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { SPORT_LEAGUES, getLeagueStatus } from "./sport-leagues";

export const STARTING_BANKROLL = 1_000;
export const LEAGUE_BANKROLL_EVENT = "thecard:league:bankroll";

export interface FreeLeagueLeaderboardEntry {
  uid: string;
  username: string;
  displayName: string;
  photoURL: string | null;
  countryCode?: string | null;
  countryName?: string | null;
  bankroll: number;
  shadowWinnings: number;
  betCount: number;
  joinedAtMs: number;
  rank: number;
  isYou?: boolean;
}

const PREFIX = "thecard:league:v1:";
const FRIEND_LEAGUE_PREFIX = "friends-";

export function normalizeFriendLeagueNumber(value: string): string | null {
  const digits = value.replace(/\D/g, "").slice(0, 6);
  return digits.length >= 4 ? digits : null;
}

export function friendLeagueId(number: string): string {
  return `${FRIEND_LEAGUE_PREFIX}${number}`;
}

export function friendLeagueNumberFromId(leagueId: string): string | null {
  return leagueId.startsWith(FRIEND_LEAGUE_PREFIX) ? leagueId.slice(FRIEND_LEAGUE_PREFIX.length) : null;
}

export function isFriendLeagueId(leagueId: string): boolean {
  return friendLeagueNumberFromId(leagueId) !== null;
}

export function createFriendLeagueNumber(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

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

export function refundLeagueBet(leagueId: string, amount: number): void {
  const m = read(leagueId);
  if (!m) return;
  write({
    ...m,
    currentBankroll: m.currentBankroll + amount,
    betCount: Math.max(0, m.betCount - 1),
    isBust: false,
  });
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
  const sportLeagueIds = SPORT_LEAGUES.filter((l) => isJoined(l.id)).map((l) => l.id);
  const friendLeagueIds = Object.keys(localStorage)
    .filter((storageKey) => storageKey.startsWith(PREFIX))
    .map((storageKey) => storageKey.slice(PREFIX.length))
    .filter(isFriendLeagueId);
  return Array.from(new Set([...sportLeagueIds, ...friendLeagueIds]));
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

async function syncFreeLeagueLeaderboardEntry(uid: string, membership: LeagueMembership): Promise<void> {
  if (!db) return;
  try {
    const userSnap = await getDoc(doc(db, "users", uid));
    const profile = userSnap.data();
    const username = (profile?.username as string | undefined) ?? uid;
    const displayName = (profile?.displayName as string | null | undefined) ?? username;
    const photoURL = (profile?.photoURL as string | null | undefined) ?? null;
    const countryCode = (profile?.countryCode as string | null | undefined) ?? null;
    const countryName = (profile?.countryName as string | null | undefined) ?? null;
    const shadowWinnings = membership.currentBankroll - membership.startingBankroll;

    await setDoc(doc(db, "freeLeagueLeaderboards", membership.leagueId, "entries", uid), {
      uid,
      username,
      displayName,
      photoURL,
      countryCode,
      countryName,
      bankroll: membership.currentBankroll,
      shadowWinnings,
      betCount: membership.betCount,
      isBust: membership.isBust,
      joinedAtMs: membership.joinedAt,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch {
    // Leaderboard mirrors should not block the league transaction path.
  }
}

export async function getUserLeagueMembership(uid: string, leagueId: string): Promise<LeagueMembership | null> {
  if (!db) return read(leagueId);
  const snap = await getDoc(doc(db, "users", uid, "leagueMemberships", leagueId));
  if (!snap.exists()) return null;
  const membership = fromFirestore(leagueId, snap.data());
  writeCache(membership);
  void syncFreeLeagueLeaderboardEntry(uid, membership);
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
    await syncFreeLeagueLeaderboardEntry(uid, membership);
  }
  writeCache(membership);
  dispatchLeagueEvent();
  return membership;
}

export async function joinUserFriendLeague(uid: string, number: string): Promise<LeagueMembership> {
  const normalized = normalizeFriendLeagueNumber(number);
  if (!normalized) throw new Error("Friend league numbers need at least four digits.");
  const leagueId = friendLeagueId(normalized);
  const membership = await joinUserLeague(uid, leagueId);
  if (db) {
    try {
      await setDoc(doc(db, "friendLeagues", leagueId), {
        leagueId,
        number: normalized,
        createdBy: uid,
        isFree: true,
        hasPayouts: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch {
      // The user membership is the source of truth; league metadata can be backfilled by rules/admin later.
    }
  }
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
  await syncFreeLeagueLeaderboardEntry(uid, updated);
  writeCache(updated);
  dispatchLeagueEvent();
  return true;
}

export async function recordUserLeaguePayout(uid: string, leagueId: string, payout: number): Promise<boolean> {
  if (!db) {
    recordLeaguePayout(leagueId, payout);
    return true;
  }
  const ref = doc(db, "users", uid, "leagueMemberships", leagueId);
  const updated = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return null;
    const membership = fromFirestore(leagueId, snap.data());
    const next: LeagueMembership = {
      ...membership,
      currentBankroll: membership.currentBankroll + payout,
      isBust: false,
    };
    tx.update(ref, {
      currentBankroll: next.currentBankroll,
      isBust: next.isBust,
      updatedAt: serverTimestamp(),
    });
    return next;
  });
  if (!updated) return false;
  await syncFreeLeagueLeaderboardEntry(uid, updated);
  writeCache(updated);
  dispatchLeagueEvent();
  return true;
}

export async function refundUserLeagueBet(uid: string, leagueId: string, amount: number): Promise<boolean> {
  if (!db) {
    refundLeagueBet(leagueId, amount);
    return true;
  }
  const ref = doc(db, "users", uid, "leagueMemberships", leagueId);
  const updated = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return null;
    const membership = fromFirestore(leagueId, snap.data());
    const next: LeagueMembership = {
      ...membership,
      currentBankroll: membership.currentBankroll + amount,
      betCount: Math.max(0, membership.betCount - 1),
      isBust: false,
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
  await syncFreeLeagueLeaderboardEntry(uid, updated);
  writeCache(updated);
  dispatchLeagueEvent();
  return true;
}

export async function getActiveJoinedLeaguesForSportForUser(uid: string, sport: Sport): Promise<string[]> {
  const memberships = await getUserLeagueMemberships(uid);
  const joined = new Set(memberships.map((membership) => membership.leagueId));
  const activeSportLeagueIds = SPORT_LEAGUES.filter(
    (league) => league.sport === sport && joined.has(league.id) && getLeagueStatus(league) === "active",
  ).map((league) => league.id);
  const friendLeagueIds = memberships
    .map((membership) => membership.leagueId)
    .filter(isFriendLeagueId);
  return [...activeSportLeagueIds, ...friendLeagueIds];
}

export function subscribeFreeLeagueLeaderboard(
  leagueId: string,
  cb: (entries: FreeLeagueLeaderboardEntry[]) => void,
  currentUid?: string | null
): Unsubscribe {
  if (!db) {
    cb([]);
    return () => {};
  }
  const q = query(
    collection(db, "freeLeagueLeaderboards", leagueId, "entries"),
    orderBy("bankroll", "desc"),
    limit(50)
  );
  return onSnapshot(q, (snap) => {
    const entries = snap.docs.map((entryDoc) => {
      const data = entryDoc.data();
      return {
        uid: (data.uid as string | undefined) ?? entryDoc.id,
        username: (data.username as string | undefined) ?? entryDoc.id,
        displayName: (data.displayName as string | undefined) ?? (data.username as string | undefined) ?? "Anonymous",
        photoURL: (data.photoURL as string | null | undefined) ?? null,
        countryCode: (data.countryCode as string | null | undefined) ?? null,
        countryName: (data.countryName as string | null | undefined) ?? null,
        bankroll: (data.bankroll as number | undefined) ?? STARTING_BANKROLL,
        shadowWinnings: (data.shadowWinnings as number | undefined) ?? 0,
        betCount: (data.betCount as number | undefined) ?? 0,
        joinedAtMs: (data.joinedAtMs as number | undefined) ?? Date.now(),
        rank: 0,
        isYou: currentUid ? entryDoc.id === currentUid : false,
      };
    });
    entries.sort((a, b) => b.bankroll - a.bankroll || b.betCount - a.betCount || a.displayName.localeCompare(b.displayName));
    cb(entries.map((entry, index) => ({ ...entry, rank: index + 1 })));
  }, () => cb([]));
}
