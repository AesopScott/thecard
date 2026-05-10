import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { DAILY_MARKETS, getDailyOutcomes } from "./daily-markets";

export type BlitzPick = "yes" | "no" | "skip";

export interface BlitzRun {
  date: string;
  picks: BlitzPick[];
  times: number[];
  score: number;
  correct: number;
  completedAtMs: number;
}

export function blitzDateId(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function scoreBlitzRun(picks: BlitzPick[], times: number[]): Pick<BlitzRun, "score" | "correct"> {
  const outcomes = getDailyOutcomes();
  let score = 0;
  let correct = 0;
  picks.forEach((pick, index) => {
    const market = DAILY_MARKETS[index];
    if (!market || pick === "skip" || pick !== outcomes[market.id]) return;
    correct += 1;
    score += (times[index] ?? 15) <= 5 ? 2 : 1;
  });
  return { score, correct };
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
    score: (data.score as number | undefined) ?? 0,
    correct: (data.correct as number | undefined) ?? 0,
    completedAtMs: (data.completedAtMs as number | undefined) ?? 0,
  };
}

export async function saveBlitzRun(uid: string, picks: BlitzPick[], times: number[], date = blitzDateId()): Promise<BlitzRun> {
  if (!db) throw new Error("Firebase not configured");
  const scored = scoreBlitzRun(picks, times);
  const run: BlitzRun = {
    date,
    picks,
    times,
    score: scored.score,
    correct: scored.correct,
    completedAtMs: Date.now(),
  };
  await setDoc(doc(db, "users", uid, "blitzRuns", date), {
    ...run,
    marketIds: DAILY_MARKETS.map((market) => market.id),
    completedAt: serverTimestamp(),
  });
  return run;
}
