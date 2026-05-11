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
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";

export type LivePickSide = "yes" | "no";
export type LiveRiskMode = "conservative" | "balanced" | "aggressive";

export interface LivePick {
  marketId: string;
  title: string;
  side: LivePickSide;
  price: number;
  status?: "pending" | "live" | "settled" | "busted" | "boosted";
  openedAt?: number;
  currentPrice?: number;
}

export interface LiveRun {
  date: string;
  gameId: string;
  picks: LivePick[];
  outcomes: Record<string, LivePickSide>;
  boostMarketId?: string | null;
  riskMode?: LiveRiskMode;
  score: number;
  correct: number;
  streak: number;
  boostedCorrect: boolean;
  perfectTicket: boolean;
  isBust: boolean;
  insuranceBadge: boolean;
  completedAtMs: number;
}

export interface LiveLeaderboardEntry {
  uid: string;
  username?: string;
  displayName: string;
  photoURL: string | null;
  score: number;
  correct: number;
  pickCount: number;
  streak: number;
  boostedCorrect: boolean;
  perfectTicket: boolean;
  isBust: boolean;
  completedAtMs: number;
}

export function liveDateId(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function hash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = (Math.imul(h, 33) ^ input.charCodeAt(i)) >>> 0;
  return h;
}

export function getLiveOutcomes(picks: LivePick[], date = liveDateId()): Record<string, LivePickSide> {
  return Object.fromEntries(
    picks.map((pick) => [pick.marketId, (hash(`${date}:${pick.marketId}`) & 1) === 0 ? "yes" : "no"])
  );
}

export function scoreLiveRun(
  picks: LivePick[],
  outcomes: Record<string, LivePickSide> = getLiveOutcomes(picks),
  boostMarketId?: string | null,
  riskMode: LiveRiskMode = "balanced"
): Pick<LiveRun, "outcomes" | "score" | "correct" | "streak" | "boostedCorrect" | "perfectTicket" | "isBust" | "insuranceBadge" | "riskMode" | "boostMarketId"> {
  let score = 0;
  let correct = 0;
  let currentStreak = 0;
  let streak = 0;
  let boostedCorrect = false;
  const riskMultiplier = riskMode === "conservative" ? 0.8 : riskMode === "aggressive" ? 1.25 : 1;

  picks.forEach((pick) => {
    if (pick.side !== outcomes[pick.marketId]) {
      currentStreak = 0;
      return;
    }
    correct += 1;
    currentStreak += 1;
    streak = Math.max(streak, currentStreak);
    let earned = pick.price >= 60 ? 1 : 2;
    if (pick.marketId === boostMarketId) {
      earned += 2;
      boostedCorrect = true;
    }
    score += earned;
  });

  if (streak >= 3) score += 1;
  score = Math.max(0, Math.round(score * riskMultiplier));
  const perfectTicket = picks.length > 0 && correct === picks.length;
  const isBust = picks.length > 0 && correct === 0;
  const insuranceBadge = !perfectTicket && picks.length > 1 && correct === picks.length - 1 && Boolean(boostMarketId);
  return { outcomes, score, correct, streak, boostedCorrect, perfectTicket, isBust, insuranceBadge, riskMode, boostMarketId: boostMarketId ?? null };
}

function isLivePick(value: unknown): value is LivePick {
  if (!value || typeof value !== "object") return false;
  const pick = value as Partial<LivePick>;
  return typeof pick.marketId === "string"
    && typeof pick.title === "string"
    && (pick.side === "yes" || pick.side === "no")
    && typeof pick.price === "number";
}

function toLiveRun(date: string, data: Record<string, unknown>): LiveRun | null {
  const picks = Array.isArray(data.picks) ? data.picks.filter(isLivePick) : [];
  const outcomes = data.outcomes && typeof data.outcomes === "object"
    ? data.outcomes as Record<string, LivePickSide>
    : {};
  if (
    data.date !== date
    || typeof data.gameId !== "string"
    || picks.length === 0
    || typeof data.score !== "number"
    || typeof data.correct !== "number"
    || typeof data.completedAtMs !== "number"
  ) {
    return null;
  }
  const scored = scoreLiveRun(
    picks,
    outcomes,
    (data.boostMarketId as string | null | undefined) ?? null,
    (data.riskMode as LiveRiskMode | undefined) ?? "balanced"
  );

  return {
    date,
    gameId: data.gameId,
    picks,
    outcomes,
    boostMarketId: (data.boostMarketId as string | null | undefined) ?? null,
    riskMode: (data.riskMode as LiveRiskMode | undefined) ?? "balanced",
    score: data.score,
    correct: data.correct,
    streak: (data.streak as number | undefined) ?? scored.streak,
    boostedCorrect: (data.boostedCorrect as boolean | undefined) ?? scored.boostedCorrect,
    perfectTicket: (data.perfectTicket as boolean | undefined) ?? scored.perfectTicket,
    isBust: (data.isBust as boolean | undefined) ?? scored.isBust,
    insuranceBadge: (data.insuranceBadge as boolean | undefined) ?? scored.insuranceBadge,
    completedAtMs: data.completedAtMs,
  };
}

export async function getStoredLiveRun(uid: string, date = liveDateId()): Promise<LiveRun | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, "users", uid, "liveRuns", date));
  if (!snap.exists()) return null;
  return toLiveRun(date, snap.data());
}

export async function saveLiveRun(
  uid: string,
  gameId: string,
  picks: LivePick[],
  profile?: { displayName?: string | null; photoURL?: string | null },
  date = liveDateId(),
  options?: { boostMarketId?: string | null; riskMode?: LiveRiskMode }
): Promise<LiveRun> {
  if (!db) throw new Error("Firebase not configured");
  const firestore = db;
  if (picks.length === 0) throw new Error("At least one live pick is required");
  if (!picks.every(isLivePick)) throw new Error("Invalid live pick");
  const scored = scoreLiveRun(picks, getLiveOutcomes(picks, date), options?.boostMarketId, options?.riskMode ?? "balanced");
  const run: LiveRun = {
    date,
    gameId,
    picks,
    ...scored,
    completedAtMs: Date.now(),
  };

  await runTransaction(firestore, async (tx) => {
    const runRef = doc(firestore, "users", uid, "liveRuns", date);
    const profileRef = doc(firestore, "users", uid);
    const leaderboardRef = doc(firestore, "liveLeaderboards", date, "entries", uid);
    const existing = await tx.get(runRef);
    if (existing.exists()) {
      throw new Error("Live Read already locked for today");
    }
    const profileSnap = await tx.get(profileRef);
    const profileData = profileSnap.data();
    const username = (profileData?.username as string | undefined) ?? undefined;
    const displayName = (profileData?.displayName as string | undefined) ?? profile?.displayName ?? username ?? "Anonymous";
    const photoURL = (profileData?.photoURL as string | null | undefined) ?? profile?.photoURL ?? null;

    tx.set(runRef, {
      ...run,
      completedAt: serverTimestamp(),
    });
    tx.set(leaderboardRef, {
      uid,
      ...(username && { username }),
      displayName,
      photoURL,
      score: run.score,
      correct: run.correct,
      pickCount: run.picks.length,
      streak: run.streak,
      boostedCorrect: run.boostedCorrect,
      perfectTicket: run.perfectTicket,
      isBust: run.isBust,
      completedAtMs: run.completedAtMs,
      completedAt: serverTimestamp(),
    });
  });

  return run;
}

export function subscribeLiveLeaderboard(
  date = liveDateId(),
  cb: (entries: LiveLeaderboardEntry[]) => void,
  onError?: () => void
): Unsubscribe {
  if (!db) {
    cb([]);
    return () => {};
  }
  const q = query(
    collection(db, "liveLeaderboards", date, "entries"),
    orderBy("score", "desc"),
    limit(25)
  );
  return onSnapshot(q, (snap) => {
    const entries = snap.docs.map((entryDoc) => {
      const data = entryDoc.data();
      return {
        uid: (data.uid as string | undefined) ?? entryDoc.id,
        username: (data.username as string | undefined) ?? undefined,
        displayName: (data.displayName as string | undefined) ?? "Anonymous",
        photoURL: (data.photoURL as string | null | undefined) ?? null,
        score: (data.score as number | undefined) ?? 0,
        correct: (data.correct as number | undefined) ?? 0,
        pickCount: (data.pickCount as number | undefined) ?? 0,
        streak: (data.streak as number | undefined) ?? 0,
        boostedCorrect: (data.boostedCorrect as boolean | undefined) ?? false,
        perfectTicket: (data.perfectTicket as boolean | undefined) ?? false,
        isBust: (data.isBust as boolean | undefined) ?? false,
        completedAtMs: (data.completedAtMs as number | undefined) ?? 0,
      };
    });
    entries.sort((a, b) => b.score - a.score || b.correct - a.correct || b.streak - a.streak || a.completedAtMs - b.completedAtMs);
    cb(entries);
  }, () => {
    onError?.();
    cb([]);
  });
}
