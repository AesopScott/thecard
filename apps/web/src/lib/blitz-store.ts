import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { DAILY_MARKETS, getDailyOutcomes } from "./daily-markets";

export type BlitzPick = "yes" | "no" | "skip";

export interface BlitzRun {
  date: string;
  picks: BlitzPick[];
  times: number[];
  powerMarketId?: string | null;
  score: number;
  correct: number;
  avgTime: number;
  bestStreak?: number;
  perfectRun?: boolean;
  completedAtMs: number;
}

export interface BlitzLeaderboardEntry {
  uid: string;
  username?: string;
  displayName: string;
  photoURL: string | null;
  score: number;
  correct: number;
  avgTime: number;
  bestStreak?: number;
  perfectRun?: boolean;
  completedAtMs: number;
}

export function blitzDateId(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function scoreBlitzRun(
  picks: BlitzPick[],
  times: number[],
  powerMarketId?: string | null
): Pick<BlitzRun, "score" | "correct" | "avgTime" | "bestStreak" | "perfectRun"> {
  const outcomes = getDailyOutcomes();
  let score = 0;
  let correct = 0;
  let streak = 0;
  let bestStreak = 0;
  const validTimes: number[] = [];
  picks.forEach((pick, index) => {
    const market = DAILY_MARKETS[index];
    const time = times[index] ?? 15;
    if (pick !== "skip") validTimes.push(time);
    if (!market || pick === "skip" || pick !== outcomes[market.id]) {
      streak = 0;
      return;
    }
    correct += 1;
    streak += 1;
    bestStreak = Math.max(bestStreak, streak);
    let earned = time <= 5 ? 2 : 1;
    if (index >= DAILY_MARKETS.length - 2) earned += 1;
    if (market.id === powerMarketId) earned += earned;
    score += earned;
  });
  if (bestStreak >= 3) score += 1;
  const avgTime = validTimes.length > 0
    ? Math.round((validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length) * 10) / 10
    : 0;
  return { score, correct, avgTime, bestStreak, perfectRun: correct === DAILY_MARKETS.length };
}

export async function getStoredBlitzRun(uid: string, date = blitzDateId()): Promise<BlitzRun | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, "users", uid, "blitzRuns", date));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    date,
    picks: (data.picks as BlitzPick[] | undefined) ?? [],
    times: (data.times as number[] | undefined) ?? [],
    powerMarketId: (data.powerMarketId as string | null | undefined) ?? null,
    score: (data.score as number | undefined) ?? 0,
    correct: (data.correct as number | undefined) ?? 0,
    avgTime: (data.avgTime as number | undefined) ?? 0,
    bestStreak: (data.bestStreak as number | undefined) ?? 0,
    perfectRun: (data.perfectRun as boolean | undefined) ?? false,
    completedAtMs: (data.completedAtMs as number | undefined) ?? 0,
  };
}

export async function saveBlitzRun(
  uid: string,
  picks: BlitzPick[],
  times: number[],
  profile?: { displayName?: string | null; photoURL?: string | null },
  date = blitzDateId(),
  powerMarketId?: string | null
): Promise<BlitzRun> {
  if (!db) throw new Error("Firebase not configured");
  if (picks.length !== DAILY_MARKETS.length) throw new Error("Pick count does not match today's Blitz markets");
  const runRef = doc(db, "users", uid, "blitzRuns", date);
  const existing = await getDoc(runRef);
  if (existing.exists()) {
    const data = existing.data();
    return {
      date,
      picks: (data.picks as BlitzPick[] | undefined) ?? [],
      times: (data.times as number[] | undefined) ?? [],
      powerMarketId: (data.powerMarketId as string | null | undefined) ?? null,
      score: (data.score as number | undefined) ?? 0,
      correct: (data.correct as number | undefined) ?? 0,
      avgTime: (data.avgTime as number | undefined) ?? 0,
      bestStreak: (data.bestStreak as number | undefined) ?? 0,
      perfectRun: (data.perfectRun as boolean | undefined) ?? false,
      completedAtMs: (data.completedAtMs as number | undefined) ?? 0,
    };
  }

  const scored = scoreBlitzRun(picks, times, powerMarketId);
  const run: BlitzRun = {
    date,
    picks,
    times,
    powerMarketId: powerMarketId ?? null,
    score: scored.score,
    correct: scored.correct,
    avgTime: scored.avgTime,
    bestStreak: scored.bestStreak,
    perfectRun: scored.perfectRun,
    completedAtMs: Date.now(),
  };
  const profileSnap = await getDoc(doc(db, "users", uid));
  const profileData = profileSnap.data();
  const username = (profileData?.username as string | undefined) ?? undefined;
  const displayName = (profileData?.displayName as string | undefined) ?? profile?.displayName ?? username ?? "Anonymous";
  const photoURL = (profileData?.photoURL as string | null | undefined) ?? profile?.photoURL ?? null;

  await setDoc(runRef, {
    ...run,
    marketIds: DAILY_MARKETS.map((market) => market.id),
    completedAt: serverTimestamp(),
  });
  await setDoc(doc(db, "blitzLeaderboards", date, "entries", uid), {
    uid,
    ...(username && { username }),
    displayName,
    photoURL,
    score: run.score,
    correct: run.correct,
    avgTime: run.avgTime,
    bestStreak: run.bestStreak ?? 0,
    perfectRun: run.perfectRun ?? false,
    completedAtMs: run.completedAtMs,
    completedAt: serverTimestamp(),
  });
  return run;
}

export function subscribeBlitzLeaderboard(
  date = blitzDateId(),
  cb: (entries: BlitzLeaderboardEntry[]) => void,
  onError?: () => void
): Unsubscribe {
  if (!db) {
    cb([]);
    return () => {};
  }
  const q = query(
    collection(db, "blitzLeaderboards", date, "entries"),
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
        avgTime: (data.avgTime as number | undefined) ?? 0,
        bestStreak: (data.bestStreak as number | undefined) ?? 0,
        perfectRun: (data.perfectRun as boolean | undefined) ?? false,
        completedAtMs: (data.completedAtMs as number | undefined) ?? 0,
      };
    });
    entries.sort((a, b) => b.score - a.score || b.correct - a.correct || a.avgTime - b.avgTime || a.completedAtMs - b.completedAtMs);
    cb(entries);
  }, () => {
    onError?.();
    cb([]);
  });
}
