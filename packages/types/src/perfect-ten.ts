export interface PerfectTenContest {
  readonly id: string;            // e.g. "2026-W20"
  readonly weekLabel: string;     // e.g. "Week of May 11"
  readonly marketIds: readonly string[];  // exactly 10
  readonly locksAt: Date;         // picks freeze at this time
  readonly endsAt: Date;          // last event resolves by this time
  readonly jackpotAmount: number; // current jackpot in dollars
  readonly rolloverWeeks: number; // consecutive weeks without a winner
  readonly baseJackpot: number;   // amount jackpot resets to after a winner
}

export interface PerfectTenPick {
  readonly contestId: string;
  readonly picks: Readonly<Record<string, "yes" | "no">>;
  readonly isSubmitted: boolean;
  readonly submittedAt: number;   // ms timestamp, 0 = not yet submitted
}
