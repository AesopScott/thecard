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
import { DAILY_MARKETS, getDailyOutcomes, getOpponentPicks } from "./daily-markets";

export type H2HPick = "yes" | "no";

export interface H2HRun {
  date: string;
  picks: H2HPick[];
  opponentPicks: Record<string, H2HPick>;
  outcomes: Record<string, H2HPick>;
  confidenceMarketId?: string | null;
  yourCorrect: number;
  opponentCorrect: number;
  yourScore: number;
  opponentScore: number;
  upsetHits: number;
  swing: number[];
  result: "win" | "loss" | "tie-win";
  completedAtMs: number;
}

export interface H2HLeaderboardEntry {
  uid: string;
  username?: string;
  displayName: string;
  photoURL: string | null;
  result: H2HRun["result"];
  yourCorrect: number;
  opponentCorrect: number;
  yourScore: number;
  opponentScore: number;
  margin: number;
  upsetHits: number;
  completedAtMs: number;
}

export function h2hDateId(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function scoreH2HRun(
  picks: H2HPick[],
  opponentPicks: Record<string, H2HPick> = getOpponentPicks(),
  outcomes: Record<string, H2HPick> = getDailyOutcomes(),
  confidenceMarketId?: string | null
): Pick<H2HRun, "opponentPicks" | "outcomes" | "confidenceMarketId" | "yourCorrect" | "opponentCorrect" | "yourScore" | "opponentScore" | "upsetHits" | "swing" | "result"> {
  let yourCorrect = 0;
  let opponentCorrect = 0;
  let yourScore = 0;
  let opponentScore = 0;
  let upsetHits = 0;
  const swing: number[] = [];

  DAILY_MARKETS.forEach((market, index) => {
    const outcome = outcomes[market.id];
    const yourPick = picks[index];
    const opponentPick = opponentPicks[market.id];
    const lowerProbabilitySide = market.yes <= market.no ? "yes" : "no";

    if (yourPick === outcome) {
      yourCorrect += 1;
      const base = market.id === confidenceMarketId ? 2 : 1;
      const upset = yourPick === lowerProbabilitySide ? 1 : 0;
      upsetHits += upset;
      yourScore += base + upset;
    }
    if (opponentPick === outcome) {
      opponentCorrect += 1;
      opponentScore += 1 + (opponentPick === lowerProbabilitySide ? 1 : 0);
    }
    swing.push(yourScore - opponentScore);
  });

  const result = yourScore === opponentScore ? "tie-win" : yourScore > opponentScore ? "win" : "loss";
  return { opponentPicks, outcomes, confidenceMarketId: confidenceMarketId ?? null, yourCorrect, opponentCorrect, yourScore, opponentScore, upsetHits, swing, result };
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
    confidenceMarketId: (data.confidenceMarketId as string | null | undefined) ?? null,
    yourCorrect: (data.yourCorrect as number | undefined) ?? 0,
    opponentCorrect: (data.opponentCorrect as number | undefined) ?? 0,
    yourScore: (data.yourScore as number | undefined) ?? (data.yourCorrect as number | undefined) ?? 0,
    opponentScore: (data.opponentScore as number | undefined) ?? (data.opponentCorrect as number | undefined) ?? 0,
    upsetHits: (data.upsetHits as number | undefined) ?? 0,
    swing: (data.swing as number[] | undefined) ?? [],
    result: (data.result as H2HRun["result"] | undefined) ?? "loss",
    completedAtMs: (data.completedAtMs as number | undefined) ?? 0,
  };
}

export async function saveH2HRun(
  uid: string,
  picks: H2HPick[],
  profile?: { displayName?: string | null; photoURL?: string | null },
  date = h2hDateId(),
  confidenceMarketId?: string | null
): Promise<H2HRun> {
  if (!db) throw new Error("Firebase not configured");
  if (picks.length !== DAILY_MARKETS.length) throw new Error("Pick count does not match today's markets");
  const runRef = doc(db, "users", uid, "h2hRuns", date);
  const existing = await getDoc(runRef);
  if (existing.exists()) {
    return (await getStoredH2HRun(uid, date))!;
  }

  const scored = scoreH2HRun(picks, getOpponentPicks(), getDailyOutcomes(), confidenceMarketId);
  const run: H2HRun = {
    date,
    picks,
    ...scored,
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
  await setDoc(doc(db, "h2hLeaderboards", date, "entries", uid), {
    uid,
    ...(username && { username }),
    displayName,
    photoURL,
    result: run.result,
    yourCorrect: run.yourCorrect,
    opponentCorrect: run.opponentCorrect,
    yourScore: run.yourScore,
    opponentScore: run.opponentScore,
    margin: run.yourScore - run.opponentScore,
    upsetHits: run.upsetHits,
    completedAtMs: run.completedAtMs,
    completedAt: serverTimestamp(),
  });
  return run;
}

export function subscribeH2HLeaderboard(
  date = h2hDateId(),
  cb: (entries: H2HLeaderboardEntry[]) => void,
  onError?: () => void
): Unsubscribe {
  if (!db) {
    cb(buildMockH2HLeaderboard());
    return () => {};
  }
  const q = query(
    collection(db, "h2hLeaderboards", date, "entries"),
    orderBy("yourScore", "desc"),
    limit(25)
  );
  return onSnapshot(q, (snap) => {
    const entries = snap.docs.map((entryDoc) => {
      const data = entryDoc.data();
      const yourCorrect = (data.yourCorrect as number | undefined) ?? 0;
      const opponentCorrect = (data.opponentCorrect as number | undefined) ?? 0;
      return {
        uid: (data.uid as string | undefined) ?? entryDoc.id,
        username: (data.username as string | undefined) ?? undefined,
        displayName: (data.displayName as string | undefined) ?? "Anonymous",
        photoURL: (data.photoURL as string | null | undefined) ?? null,
        result: (data.result as H2HRun["result"] | undefined) ?? "loss",
        yourCorrect,
        opponentCorrect,
        yourScore: (data.yourScore as number | undefined) ?? yourCorrect,
        opponentScore: (data.opponentScore as number | undefined) ?? opponentCorrect,
        margin: (data.margin as number | undefined) ?? yourCorrect - opponentCorrect,
        upsetHits: (data.upsetHits as number | undefined) ?? 0,
        completedAtMs: (data.completedAtMs as number | undefined) ?? 0,
      };
    });
    entries.sort((a, b) =>
      Number(b.result !== "loss") - Number(a.result !== "loss")
      || b.yourScore - a.yourScore
      || b.margin - a.margin
      || b.upsetHits - a.upsetHits
      || a.completedAtMs - b.completedAtMs
    );
    cb([...entries, ...buildMockH2HLeaderboard()]);
  }, () => {
    onError?.();
    cb(buildMockH2HLeaderboard());
  });
}

function buildMockH2HLeaderboard(): H2HLeaderboardEntry[] {
  return [
    { uid: "mock-h2h-1", displayName: "MarketMike", photoURL: "/avatars/preview-market-mike.svg", result: "win", yourCorrect: 5, opponentCorrect: 2, yourScore: 7, opponentScore: 3, margin: 4, upsetHits: 2, completedAtMs: Date.now() - 600000 },
    { uid: "mock-h2h-2", displayName: "FadeTheLine", photoURL: "/avatars/preview-fade-the-line.svg", result: "win", yourCorrect: 4, opponentCorrect: 2, yourScore: 6, opponentScore: 3, margin: 3, upsetHits: 2, completedAtMs: Date.now() - 900000 },
    { uid: "mock-h2h-3", displayName: "Challenger", photoURL: "/avatars/preview-challenger.svg", result: "tie-win", yourCorrect: 3, opponentCorrect: 3, yourScore: 4, opponentScore: 4, margin: 0, upsetHits: 1, completedAtMs: Date.now() - 1200000 },
    { uid: "mock-h2h-4", displayName: "SundaySharp", photoURL: "/avatars/preview-sunday-sharp.svg", result: "loss", yourCorrect: 2, opponentCorrect: 4, yourScore: 3, opponentScore: 6, margin: -3, upsetHits: 1, completedAtMs: Date.now() - 1500000 },
  ];
}
