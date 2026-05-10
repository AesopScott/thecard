export interface DailyMarket {
  id: string;
  sport: string;
  question: string;
  yes: number; // cents (0–100)
  no: number;
}

export const DAILY_MARKETS: DailyMarket[] = [
  { id: "m1", sport: "NFL",  question: "Chiefs cover the spread tonight",      yes: 58, no: 42 },
  { id: "m2", sport: "NBA",  question: "LeBron drops 30+ vs the Celtics",      yes: 44, no: 56 },
  { id: "m3", sport: "UFC",  question: "Jones retains the heavyweight title",   yes: 71, no: 29 },
  { id: "m4", sport: "MLB",  question: "Dodgers win Game 3",                    yes: 62, no: 38 },
  { id: "m5", sport: "NHL",  question: "Ovechkin scores tonight",               yes: 37, no: 63 },
];

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) ^ s.charCodeAt(i)) >>> 0;
  return h;
}

/** Seeded by date — every user gets the same outcomes on the same day. */
export function getDailyOutcomes(): Record<string, "yes" | "no"> {
  const h = djb2(new Date().toDateString());
  return Object.fromEntries(
    DAILY_MARKETS.map((m, i) => [m.id, ((h >>> i) & 1) === 0 ? "yes" : "no"])
  );
}

/** Opponent picks — seeded differently so they diverge from outcomes and from the user. */
export function getOpponentPicks(): Record<string, "yes" | "no"> {
  const h = djb2(new Date().toDateString() + ":opp");
  return Object.fromEntries(
    DAILY_MARKETS.map((m, i) => [m.id, ((h >>> i) & 1) === 0 ? "yes" : "no"])
  );
}
