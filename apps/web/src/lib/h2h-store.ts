import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { DAILY_MARKETS, getDailyOutcomes, getOpponentPicks } from "./daily-markets";

export type H2HPick = "yes" | "no";

export interface H2HRun {
  date: string;
  picks: H2HPick[];
  opponentPicks: Record<string, H2HPick>;
  outcomes: Record<string, H2HPick>;
  yourCorrect: number;
  opponentCorrect: number;
  result: "win" | "loss" | "tie-win";
  completedAtMs: number;
}

export function h2hDateId(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function scoreH2HRun(
  picks: H2HPick[],
  opponentPicks: Record<string, H2HPick> = getOpponentPicks(),
  outcomes: Record<string, H2HPick> = getDailyOutcomes()
): Pick<H2HRun, "opponentPicks" | "outcomes" | "yourCorrect" | "opponentCorrect" | "result"> {
  const yourCorrect = DAILY_MARKETS.filter((market, index) => picks[index] === outcomes[market.id]).length;
  const opponentCorrect = DAILY_MARKETS.filter((market) => opponentPicks[market.id] === outcomes[market.id]).length;
  const result = yourCorrect === opponentCorrect ? "tie-win" : yourCorrect > opponentCorrect ? "win" : "loss";
  return { opponentPicks, outcomes, yourCorrect, opponentCorrect, result };
}

export async function getStoredH2HRun(uid: string, date = h2hDateId()): Promise<H2HRun | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, "users", uid, "h2hRuns", date));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    date,
    picks: (data.picks as H2HPick[] | undefined) ?? [],
    opponentPicks: (data.opponentPicks as Record<string, H2HPick> | undefined) ?? {},
    outcomes: (data.outcomes as Record<string, H2HPick> | undefined) ?? {},
    yourCorrect: (data.yourCorrect as number | undefined) ?? 0,
    opponentCorrect: (data.opponentCorrect as number | undefined) ?? 0,
    result: (data.result as H2HRun["result"] | undefined) ?? "loss",
    completedAtMs: (data.completedAtMs as number | undefined) ?? 0,
  };
}

export async function saveH2HRun(uid: string, picks: H2HPick[], date = h2hDateId()): Promise<H2HRun> {
  if (!db) throw new Error("Firebase not configured");
  if (picks.length !== DAILY_MARKETS.length) throw new Error("Pick count does not match today's markets");
  const scored = scoreH2HRun(picks);
  const run: H2HRun = {
    date,
    picks,
    ...scored,
    completedAtMs: Date.now(),
  };
  await setDoc(doc(db, "users", uid, "h2hRuns", date), {
    ...run,
    marketIds: DAILY_MARKETS.map((market) => market.id),
    completedAt: serverTimestamp(),
  });
  return run;
}
