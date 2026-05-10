import type { Season, League, LeagueMembership, SeasonLeaderboardEntry } from "@thecard/types";
import { doc, getDoc, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export const STARTING_BANKROLL = 1_000;

// First season is August 2026 (NFL preseason opens)
const FIRST_SEASON_YEAR = 2026;
const FIRST_SEASON_MONTH = 7; // 0-indexed: July=6, August=7

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function buildSeason(year: number, month: number): Season {
  const id = `${year}-${String(month + 1).padStart(2, "0")}`;
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return {
    id,
    name: `${MONTH_NAMES[month]} ${year}`,
    startDate,
    endDate,
    prizePoolEstimate: 5_000,
  };
}

// Returns 1-based season number (August 2026 = Season 1)
export function getSeasonNumber(season: Season): number {
  const [yearStr, monthStr] = season.id.split("-");
  const year = parseInt(yearStr ?? "2026", 10);
  const month = parseInt(monthStr ?? "8", 10); // 1-indexed
  return (year - FIRST_SEASON_YEAR) * 12 + (month - (FIRST_SEASON_MONTH + 1)) + 1;
}

// Returns the active or upcoming season. Before Season 1, returns Season 1 as upcoming.
export function getActiveSeason(): Season {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  const firstSeasonMs = new Date(FIRST_SEASON_YEAR, FIRST_SEASON_MONTH, 1).getTime();
  if (now.getTime() < firstSeasonMs) {
    return buildSeason(FIRST_SEASON_YEAR, FIRST_SEASON_MONTH);
  }
  return buildSeason(year, month);
}

export const ACTIVE_SEASON: Season = getActiveSeason();

export const GLOBAL_LEAGUE: League = {
  id: `global-${ACTIVE_SEASON.id}`,
  seasonId: ACTIVE_SEASON.id,
  name: "Global",
  type: "global",
  memberCount: 1_247,
};

// Storage key includes season ID so bankrolls naturally reset each month
const STORAGE_KEY = `thecard:season:v1:${ACTIVE_SEASON.id}`;

export function getSeasonStatus(season: Season): "upcoming" | "active" | "closed" {
  const now = Date.now();
  if (now < season.startDate.getTime()) return "upcoming";
  if (now > season.endDate.getTime()) return "closed";
  return "active";
}

export function daysUntilSeason(season: Season): number {
  const diff = season.startDate.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function daysLeftInSeason(season: Season): number {
  const diff = season.endDate.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

interface SeasonState {
  memberships: Record<string, LeagueMembership>;
}

export const SEASON_BANKROLL_EVENT = "thecard:season:bankroll";

function read(): SeasonState {
  if (typeof window === "undefined") return { memberships: {} };
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return (typeof parsed === "object" && parsed !== null && "memberships" in parsed)
      ? (parsed as SeasonState)
      : { memberships: {} };
  } catch {
    return { memberships: {} };
  }
}

function write(state: SeasonState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(SEASON_BANKROLL_EVENT));
}

function writeCache(state: SeasonState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function dispatchSeasonEvent(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SEASON_BANKROLL_EVENT));
}

function ensureMembership(state: SeasonState, leagueId: string, seasonId: string): SeasonState {
  if (state.memberships[leagueId]) return state;
  return {
    ...state,
    memberships: {
      ...state.memberships,
      [leagueId]: {
        leagueId,
        seasonId,
        startingBankroll: STARTING_BANKROLL,
        currentBankroll: STARTING_BANKROLL,
        betCount: 0,
        isBust: false,
        joinedAt: Date.now(),
      },
    },
  };
}

export function initGlobalLeague(): void {
  const state = ensureMembership(read(), GLOBAL_LEAGUE.id, ACTIVE_SEASON.id);
  write(state);
}

export function getMembership(leagueId: string): LeagueMembership {
  const state = ensureMembership(read(), leagueId, ACTIVE_SEASON.id);
  return state.memberships[leagueId]!;
}

export function getBankroll(leagueId: string): number {
  return getMembership(leagueId).currentBankroll;
}

// Returns false if bankroll insufficient or player is bust
export function placeBet(leagueId: string, amount: number): boolean {
  let state = ensureMembership(read(), leagueId, ACTIVE_SEASON.id);
  const m = state.memberships[leagueId]!;
  if (m.isBust || m.currentBankroll < amount) return false;

  const newBankroll = Math.max(0, m.currentBankroll - amount);
  state = {
    ...state,
    memberships: {
      ...state.memberships,
      [leagueId]: {
        ...m,
        currentBankroll: newBankroll,
        betCount: m.betCount + 1,
        isBust: newBankroll <= 0,
      },
    },
  };
  write(state);
  return true;
}

export function recordPayout(leagueId: string, payout: number): void {
  let state = ensureMembership(read(), leagueId, ACTIVE_SEASON.id);
  const m = state.memberships[leagueId]!;
  state = {
    ...state,
    memberships: {
      ...state.memberships,
      [leagueId]: { ...m, currentBankroll: m.currentBankroll + payout },
    },
  };
  write(state);
}

function fromFirestore(leagueId: string, data: Record<string, unknown>): LeagueMembership {
  return {
    leagueId,
    seasonId: (data.seasonId as string | undefined) ?? ACTIVE_SEASON.id,
    startingBankroll: (data.startingBankroll as number | undefined) ?? STARTING_BANKROLL,
    currentBankroll: (data.currentBankroll as number | undefined) ?? STARTING_BANKROLL,
    betCount: (data.betCount as number | undefined) ?? 0,
    isBust: (data.isBust as boolean | undefined) ?? false,
    joinedAt: (data.joinedAtMs as number | undefined) ?? (data.joinedAt as number | undefined) ?? Date.now(),
  };
}

function cacheMembership(membership: LeagueMembership): void {
  const state = ensureMembership(read(), membership.leagueId, membership.seasonId);
  writeCache({
    ...state,
    memberships: {
      ...state.memberships,
      [membership.leagueId]: membership,
    },
  });
}

export async function getUserSeasonMembership(uid: string, leagueId = GLOBAL_LEAGUE.id): Promise<LeagueMembership> {
  if (!db) return getMembership(leagueId);
  const ref = doc(db, "users", uid, "seasonMemberships", leagueId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const membership = fromFirestore(leagueId, snap.data());
    cacheMembership(membership);
    return membership;
  }
  const membership: LeagueMembership = {
    leagueId,
    seasonId: ACTIVE_SEASON.id,
    startingBankroll: STARTING_BANKROLL,
    currentBankroll: STARTING_BANKROLL,
    betCount: 0,
    isBust: false,
    joinedAt: Date.now(),
  };
  await setDoc(ref, {
    ...membership,
    joinedAtMs: membership.joinedAt,
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  cacheMembership(membership);
  dispatchSeasonEvent();
  return membership;
}

export async function placeUserSeasonBet(uid: string, amount: number, leagueId = GLOBAL_LEAGUE.id): Promise<LeagueMembership | null> {
  if (!db) {
    const ok = placeBet(leagueId, amount);
    return ok ? getMembership(leagueId) : null;
  }
  const ref = doc(db, "users", uid, "seasonMemberships", leagueId);
  const updated = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    let membership: LeagueMembership;
    const exists = snap.exists();
    if (exists) {
      membership = fromFirestore(leagueId, snap.data());
    } else {
      membership = {
        leagueId,
        seasonId: ACTIVE_SEASON.id,
        startingBankroll: STARTING_BANKROLL,
        currentBankroll: STARTING_BANKROLL,
        betCount: 0,
        isBust: false,
        joinedAt: Date.now(),
      };
    }
    if (membership.isBust || membership.currentBankroll < amount) return null;
    const newBankroll = Math.max(0, membership.currentBankroll - amount);
    const next: LeagueMembership = {
      ...membership,
      currentBankroll: newBankroll,
      betCount: membership.betCount + 1,
      isBust: newBankroll <= 0,
    };
    if (exists) {
      tx.update(ref, {
        currentBankroll: next.currentBankroll,
        betCount: next.betCount,
        isBust: next.isBust,
        updatedAt: serverTimestamp(),
      });
    } else {
      tx.set(ref, {
        ...next,
        joinedAtMs: next.joinedAt,
        joinedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return next;
  });
  if (!updated) return null;
  cacheMembership(updated);
  dispatchSeasonEvent();
  return updated;
}

export async function recordUserSeasonPayout(uid: string, payout: number, leagueId = GLOBAL_LEAGUE.id): Promise<LeagueMembership> {
  if (!db) {
    recordPayout(leagueId, payout);
    return getMembership(leagueId);
  }
  const ref = doc(db, "users", uid, "seasonMemberships", leagueId);
  const updated = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const membership = snap.exists()
      ? fromFirestore(leagueId, snap.data())
      : {
          leagueId,
          seasonId: ACTIVE_SEASON.id,
          startingBankroll: STARTING_BANKROLL,
          currentBankroll: STARTING_BANKROLL,
          betCount: 0,
          isBust: false,
          joinedAt: Date.now(),
        };
    const next: LeagueMembership = {
      ...membership,
      currentBankroll: membership.currentBankroll + payout,
      isBust: false,
    };
    if (snap.exists()) {
      tx.update(ref, {
        currentBankroll: next.currentBankroll,
        isBust: next.isBust,
        updatedAt: serverTimestamp(),
      });
    } else {
      tx.set(ref, {
        ...next,
        joinedAtMs: next.joinedAt,
        joinedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return next;
  });
  cacheMembership(updated);
  dispatchSeasonEvent();
  return updated;
}

// Inserts the user's real bankroll + betCount into mock standings at the correct rank
export function buildSeasonLeaderboard(userBankroll: number, userBetCount: number): SeasonLeaderboardEntry[] {
  const mocks: Omit<SeasonLeaderboardEntry, "rank">[] = [
    { displayName: "SharpMike", avatarInitial: "S", bankroll: 1_847, betCount: 23 },
    { displayName: "CalibrationKing", avatarInitial: "C", bankroll: 1_612, betCount: 31 },
    { displayName: "NFLNerd88", avatarInitial: "N", bankroll: 1_544, betCount: 19 },
    { displayName: "TheBookie", avatarInitial: "T", bankroll: 1_489, betCount: 27 },
    { displayName: "GridironGuru", avatarInitial: "G", bankroll: 1_401, betCount: 14 },
    { displayName: "OddsWizard", avatarInitial: "O", bankroll: 1_355, betCount: 22 },
    { displayName: "SportsSage", avatarInitial: "S", bankroll: 1_288, betCount: 18 },
    { displayName: "ProbabilityPete", avatarInitial: "P", bankroll: 1_201, betCount: 33 },
    { displayName: "LineSharp", avatarInitial: "L", bankroll: 1_144, betCount: 11 },
    { displayName: "MarketMaker", avatarInitial: "M", bankroll: 1_089, betCount: 29 },
    { displayName: "EdgeFinder", avatarInitial: "E", bankroll: 1_022, betCount: 16 },
    { displayName: "WildcardWill", avatarInitial: "W", bankroll: 978, betCount: 20 },
    { displayName: "VarianceVic", avatarInitial: "V", bankroll: 901, betCount: 25 },
    { displayName: "HunchPlayer", avatarInitial: "H", bankroll: 834, betCount: 38 },
    { displayName: "LongShot", avatarInitial: "L", bankroll: 712, betCount: 42 },
  ];

  const you = { displayName: "You", avatarInitial: "Y", bankroll: userBankroll, betCount: userBetCount, isYou: true };
  const combined = [...mocks, you].sort((a, b) => b.bankroll - a.bankroll);
  return combined.map((entry, i) => ({ ...entry, rank: i + 1 }));
}
