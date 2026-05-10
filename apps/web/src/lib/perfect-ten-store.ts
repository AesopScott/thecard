import type { PerfectTenContest, PerfectTenPick } from "@thecard/types";

export const BASE_JACKPOT = 5_000;
export const P10_PICK_EVENT = "thecard:p10:pick";

// Phase A: hardcoded weekly contest. Phase 2: fetch from Firestore.
// Week is Monday–Sunday; picks lock Sunday 11:59 PM ET.
export const CURRENT_CONTEST: PerfectTenContest = {
  id: "2026-W20",
  weekLabel: "Week of May 11",
  marketIds: [
    "mock-nfl-01",
    "mock-nfl-02",
    "mock-nfl-03",
    "mock-nba-01",
    "mock-ufc-01",
    "mock-mlb-01",
    "mock-ncaaf-01",
    "mock-soccer-01",
    "mock-ncaab-01",
    "mock-nhl-01",
  ],
  locksAt: new Date("2026-05-17T23:59:00-05:00"),
  endsAt: new Date("2026-05-18T06:00:00-05:00"),
  jackpotAmount: 42_000,
  rolloverWeeks: 2,
  baseJackpot: BASE_JACKPOT,
};

const storageKey = (contestId: string) => `thecard:p10:v1:${contestId}`;

function emptyPick(contestId: string): PerfectTenPick {
  return { contestId, picks: {}, isSubmitted: false, submittedAt: 0 };
}

export function getPick(contestId: string): PerfectTenPick {
  if (typeof window === "undefined") return emptyPick(contestId);
  try {
    const raw = localStorage.getItem(storageKey(contestId));
    return raw ? (JSON.parse(raw) as PerfectTenPick) : emptyPick(contestId);
  } catch {
    return emptyPick(contestId);
  }
}

export function setPick(contestId: string, marketId: string, side: "yes" | "no"): PerfectTenPick {
  const current = getPick(contestId);
  if (current.isSubmitted || isLocked()) return current;
  const updated: PerfectTenPick = {
    ...current,
    picks: { ...current.picks, [marketId]: side },
  };
  localStorage.setItem(storageKey(contestId), JSON.stringify(updated));
  window.dispatchEvent(new Event(P10_PICK_EVENT));
  return updated;
}

export function submitPicks(contestId: string): PerfectTenPick | null {
  const current = getPick(contestId);
  const contest = CURRENT_CONTEST;
  if (contest.id !== contestId) return null;
  if (Object.keys(current.picks).length < contest.marketIds.length) return null;
  if (current.isSubmitted || isLocked()) return current;
  const submitted: PerfectTenPick = { ...current, isSubmitted: true, submittedAt: Date.now() };
  localStorage.setItem(storageKey(contestId), JSON.stringify(submitted));
  window.dispatchEvent(new Event(P10_PICK_EVENT));
  return submitted;
}

export function isLocked(): boolean {
  return Date.now() >= CURRENT_CONTEST.locksAt.getTime();
}

export function countdownToLock(): string {
  const diff = CURRENT_CONTEST.locksAt.getTime() - Date.now();
  if (diff <= 0) return "Locked";
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function formatDollars(n: number): string {
  return n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `$${(n / 1_000).toFixed(0)}K`
    : `$${n.toLocaleString()}`;
}
