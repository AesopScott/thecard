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

export interface LivePick {
  marketId: string;
  title: string;
  side: LivePickSide;
  price: number;
}

export interface LiveRun {
  date: string;
  gameId: string;
  picks: LivePick[];
  outcomes: Record<string, LivePickSide>;
  score: number;
  correct: number;
  completedAtMs: number;
}

export interface LiveLeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL: string | null;
  score: number;
  correct: number;
  pickCount: number;
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
  outcomes: Record<string, LivePickSide> = getLiveOutcomes(picks)
): Pick<LiveRun, "outcomes" | "score" | "correct"> {
  let score = 0;
  let correct = 0;
  picks.forEach((pick) => {
    if (pick.side !== outcomes[pick.marketId]) return;
    correct += 1;
    score += pick.price >= 60 ? 1 : 2;
  });
  return { outcomes, score, correct };
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

  return {
    date,
    gameId: data.gameId,
    picks,
    outcomes,
    score: data.score,
    correct: data.correct,
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
  date = liveDateId()
): Promise<LiveRun> {
  if (!db) throw new Error("Firebase not configured");
  const firestore = db;
  if (picks.length === 0) throw new Error("At least one live pick is required");
  if (!picks.every(isLivePick)) throw new Error("Invalid live pick");
  const scored = scoreLiveRun(picks, getLiveOutcomes(picks, date));
  const run: LiveRun = {
    date,
    gameId,
    picks,
    ...scored,
    completedAtMs: Date.now(),
  };

  await runTransaction(firestore, async (tx) => {
    const runRef = doc(firestore, "users", uid, "liveRuns", date);
    const leaderboardRef = doc(firestore, "liveLeaderboards", date, "entries", uid);
    const existing = await tx.get(runRef);
    if (existing.exists()) {
      throw new Error("Live Read already locked for today");
    }

    tx.set(runRef, {
      ...run,
      completedAt: serverTimestamp(),
    });
    tx.set(leaderboardRef, {
      uid,
      displayName: profile?.displayName || "Anonymous",
      photoURL: profile?.photoURL ?? null,
      score: run.score,
      correct: run.correct,
      pickCount: run.picks.length,
      completedAtMs: run.completedAtMs,
      completedAt: serverTimestamp(),
    });
  });

  return run;
}

export function subscribeLiveLeaderboard(
  date = liveDateId(),
  cb: (entries: LiveLeaderboardEntry[]) => void
): Unsubscribe {
  cb([]);
  if (!db) return () => {};
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
        displayName: (data.displayName as string | undefined) ?? "Anonymous",
        photoURL: (data.photoURL as string | null | undefined) ?? null,
        score: (data.score as number | undefined) ?? 0,
        correct: (data.correct as number | undefined) ?? 0,
        pickCount: (data.pickCount as number | undefined) ?? 0,
        completedAtMs: (data.completedAtMs as number | undefined) ?? 0,
      };
    });
    entries.sort((a, b) => b.score - a.score || b.correct - a.correct || a.completedAtMs - b.completedAtMs);
    cb(entries);
  }, () => cb([]));
}
