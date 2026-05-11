import type { Season, League, LeagueMembership, SeasonLeaderboardEntry } from "@thecard/types";
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export const STARTING_BANKROLL = 1_000;
export const MIN_PRIZE_BETS = 5;
export const PAYOUT_SHARES = [0.4, 0.2, 0.1, 0.075, 0.06, 0.05, 0.04, 0.035, 0.025, 0.015] as const;

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
    minPrizeBets: MIN_PRIZE_BETS,
    payoutShares: PAYOUT_SHARES,
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

export function getSeasonById(seasonId: string): Season {
  const [yearStr, monthStr] = seasonId.split("-");
  const year = parseInt(yearStr ?? String(FIRST_SEASON_YEAR), 10);
  const month = parseInt(monthStr ?? String(FIRST_SEASON_MONTH + 1), 10) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(month)) return buildSeason(FIRST_SEASON_YEAR, FIRST_SEASON_MONTH);
  return buildSeason(year, month);
}

export function getGlobalLeagueForSeason(season: Season): League {
  return {
    id: `global-${season.id}`,
    seasonId: season.id,
    name: "Global",
    type: "global",
    memberCount: 1_247,
  };
}

export function getSeasonTimeline(): Season[] {
  const activeNumber = getSeasonNumber(ACTIVE_SEASON);
  const startOffset = Math.max(0, activeNumber - 3);
  return Array.from({ length: 5 }, (_, index) => {
    const monthOffset = startOffset + index;
    const date = new Date(FIRST_SEASON_YEAR, FIRST_SEASON_MONTH + monthOffset, 1);
    return buildSeason(date.getFullYear(), date.getMonth());
  });
}

export function getSeasonRolloverCopy(season = ACTIVE_SEASON): string {
  const nextDate = new Date(season.endDate.getFullYear(), season.endDate.getMonth() + 1, 1);
  const nextSeason = buildSeason(nextDate.getFullYear(), nextDate.getMonth());
  return `Season ${getSeasonNumber(nextSeason)} opens ${nextSeason.startDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })} with every player reset to $${STARTING_BANKROLL.toLocaleString()}.`;
}

export const GLOBAL_LEAGUE: League = getGlobalLeagueForSeason(ACTIVE_SEASON);

export const SEASON_RULES = {
  minPrizeBets: MIN_PRIZE_BETS,
  payoutShares: PAYOUT_SHARES,
  startingBankroll: STARTING_BANKROLL,
} as const;

export const SEASON_PAYOUT_LABELS = PAYOUT_SHARES.map((share, index) => ({
  rank: index + 1,
  share,
}));

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

export function refundBet(leagueId: string, amount: number): void {
  let state = ensureMembership(read(), leagueId, ACTIVE_SEASON.id);
  const m = state.memberships[leagueId]!;
  state = {
    ...state,
    memberships: {
      ...state.memberships,
      [leagueId]: {
        ...m,
        currentBankroll: m.currentBankroll + amount,
        betCount: Math.max(0, m.betCount - 1),
        isBust: false,
      },
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

function avatarInitial(displayName: string): string {
  return (displayName.trim()[0] ?? "?").toUpperCase();
}

async function syncSeasonLeaderboardEntry(uid: string, membership: LeagueMembership): Promise<void> {
  if (!db) return;
  const userSnap = await getDoc(doc(db, "users", uid));
  const profile = userSnap.data();
  const username = (profile?.username as string | undefined) ?? uid;
  const displayName = (profile?.displayName as string | null | undefined) ?? username;
  const photoURL = (profile?.photoURL as string | null | undefined) ?? null;

  await setDoc(doc(db, "seasonLeaderboards", membership.leagueId, "entries", uid), {
    uid,
    username,
    displayName,
    photoURL,
    avatarInitial: avatarInitial(displayName),
    bankroll: membership.currentBankroll,
    betCount: membership.betCount,
    isBust: membership.isBust,
    seasonId: membership.seasonId,
    joinedAtMs: membership.joinedAt,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function getUserSeasonMembership(uid: string, leagueId = GLOBAL_LEAGUE.id): Promise<LeagueMembership> {
  return joinUserSeasonLeague(uid, leagueId);
}

export async function getExistingUserSeasonMembership(uid: string, leagueId = GLOBAL_LEAGUE.id): Promise<LeagueMembership | null> {
  if (!db) return getMembership(leagueId);
  const ref = doc(db, "users", uid, "seasonMemberships", leagueId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const membership = fromFirestore(leagueId, snap.data());
    cacheMembership(membership);
    void syncSeasonLeaderboardEntry(uid, membership);
    return membership;
  }
  return null;
}

export async function joinUserSeasonLeague(uid: string, leagueId = GLOBAL_LEAGUE.id): Promise<LeagueMembership> {
  if (!db) {
    initGlobalLeague();
    return getMembership(leagueId);
  }
  const existing = await getExistingUserSeasonMembership(uid, leagueId);
  if (existing) return existing;
  const ref = doc(db, "users", uid, "seasonMemberships", leagueId);
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
  await syncSeasonLeaderboardEntry(uid, membership);
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
      return null;
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
  await syncSeasonLeaderboardEntry(uid, updated);
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
  await syncSeasonLeaderboardEntry(uid, updated);
  cacheMembership(updated);
  dispatchSeasonEvent();
  return updated;
}

export async function refundUserSeasonBet(uid: string, amount: number, leagueId = GLOBAL_LEAGUE.id): Promise<LeagueMembership> {
  if (!db) {
    refundBet(leagueId, amount);
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
      currentBankroll: membership.currentBankroll + amount,
      betCount: Math.max(0, membership.betCount - 1),
      isBust: false,
    };
    if (snap.exists()) {
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
  await syncSeasonLeaderboardEntry(uid, updated);
  cacheMembership(updated);
  dispatchSeasonEvent();
  return updated;
}

export function subscribeToSeasonLeaderboard(
  leagueId: string,
  cb: (entries: SeasonLeaderboardEntry[]) => void,
  currentUid?: string | null
): () => void {
  if (!db) {
    cb([]);
    return () => {};
  }
  const q = query(
    collection(db, "seasonLeaderboards", leagueId, "entries"),
    orderBy("bankroll", "desc"),
    limit(100)
  );
  return onSnapshot(q, (snap) => {
    const entries = snap.docs.map((entryDoc) => {
      const data = entryDoc.data();
      return {
        uid: entryDoc.id,
        username: (data.username as string | undefined) ?? entryDoc.id,
        displayName: (data.displayName as string | undefined) ?? (data.username as string | undefined) ?? "Anonymous",
        photoURL: (data.photoURL as string | null | undefined) ?? null,
        avatarInitial: (data.avatarInitial as string | undefined) ?? avatarInitial((data.displayName as string | undefined) ?? "Anonymous"),
        bankroll: (data.bankroll as number | undefined) ?? STARTING_BANKROLL,
        betCount: (data.betCount as number | undefined) ?? 0,
        isYou: currentUid ? entryDoc.id === currentUid : false,
      };
    });
    entries.sort((a, b) => {
      if (b.bankroll !== a.bankroll) return b.bankroll - a.bankroll;
      if (b.betCount !== a.betCount) return b.betCount - a.betCount;
      return a.displayName.localeCompare(b.displayName);
    });
    cb([...entries, ...buildSeasonPreviewEntries()].map((entry, i) => ({ ...entry, rank: i + 1 })));
  }, () => cb(buildSeasonPreviewEntries().map((entry, i) => ({ ...entry, rank: i + 1 }))));
}

function buildSeasonPreviewEntries(): Omit<SeasonLeaderboardEntry, "rank">[] {
  return [
    { uid: "mock-season-1", username: "sharpmike", displayName: "SharpMike", photoURL: "/avatars/preview-market-mike.svg", avatarInitial: "S", bankroll: 1_847, betCount: 23, isPreview: true },
    { uid: "mock-season-2", username: "calibrationking", displayName: "CalibrationKing", photoURL: "/avatars/preview-fade-the-line.svg", avatarInitial: "C", bankroll: 1_612, betCount: 31, isPreview: true },
    { uid: "mock-season-3", username: "nflnerd88", displayName: "NFLNerd88", photoURL: "/avatars/preview-challenger.svg", avatarInitial: "N", bankroll: 1_544, betCount: 19, isPreview: true },
    { uid: "mock-season-4", username: "thebookie", displayName: "TheBookie", photoURL: "/avatars/preview-sunday-sharp.svg", avatarInitial: "T", bankroll: 1_489, betCount: 27, isPreview: true },
    { uid: "mock-season-5", username: "gridironguru", displayName: "GridironGuru", photoURL: "/avatars/preview-drive-reader.svg", avatarInitial: "G", bankroll: 1_401, betCount: 14, isPreview: true },
    { uid: "mock-season-6", username: "oddswizard", displayName: "OddsWizard", photoURL: "/avatars/preview-red-zone-ray.svg", avatarInitial: "O", bankroll: 1_355, betCount: 22, isPreview: true },
    { uid: "mock-season-7", username: "sportssage", displayName: "SportsSage", photoURL: "/avatars/preview-clock-sharp.svg", avatarInitial: "S", bankroll: 1_288, betCount: 18, isPreview: true },
    { uid: "mock-season-8", username: "probabilitypete", displayName: "ProbabilityPete", photoURL: "/avatars/preview-momentum.svg", avatarInitial: "P", bankroll: 1_201, betCount: 33, isPreview: true },
    { uid: "mock-season-9", username: "linesharp", displayName: "LineSharp", photoURL: "/avatars/preview-market-mike.svg", avatarInitial: "L", bankroll: 1_144, betCount: 11, isPreview: true },
    { uid: "mock-season-10", username: "marketmaker", displayName: "MarketMaker", photoURL: "/avatars/preview-fade-the-line.svg", avatarInitial: "M", bankroll: 1_089, betCount: 29, isPreview: true },
    { uid: "mock-season-11", username: "edgefinder", displayName: "EdgeFinder", photoURL: "/avatars/preview-challenger.svg", avatarInitial: "E", bankroll: 1_022, betCount: 16, isPreview: true },
    { uid: "mock-season-12", username: "wildcardwill", displayName: "WildcardWill", photoURL: "/avatars/preview-sunday-sharp.svg", avatarInitial: "W", bankroll: 978, betCount: 20, isPreview: true },
    { uid: "mock-season-13", username: "variancevic", displayName: "VarianceVic", photoURL: "/avatars/preview-drive-reader.svg", avatarInitial: "V", bankroll: 901, betCount: 25, isPreview: true },
    { uid: "mock-season-14", username: "hunchplayer", displayName: "HunchPlayer", photoURL: "/avatars/preview-red-zone-ray.svg", avatarInitial: "H", bankroll: 834, betCount: 38, isPreview: true },
    { uid: "mock-season-15", username: "longshot", displayName: "LongShot", photoURL: "/avatars/preview-clock-sharp.svg", avatarInitial: "L", bankroll: 712, betCount: 42, isPreview: true },
  ];
}

// Inserts the user's real bankroll + betCount into preview standings at the correct rank
export function buildSeasonLeaderboard(
  userBankroll: number,
  userBetCount: number,
  user?: Pick<SeasonLeaderboardEntry, "uid" | "username" | "displayName" | "photoURL" | "avatarInitial" | "isYou">
): SeasonLeaderboardEntry[] {
  const you = {
    displayName: user?.displayName ?? "You",
    username: user?.username,
    uid: user?.uid,
    photoURL: user?.photoURL,
    avatarInitial: user?.avatarInitial ?? "Y",
    bankroll: userBankroll,
    betCount: userBetCount,
    isYou: true,
  };
  const combined = [...buildSeasonPreviewEntries(), you].sort((a, b) => b.bankroll - a.bankroll);
  return combined.map((entry, i) => ({ ...entry, rank: i + 1 }));
}
