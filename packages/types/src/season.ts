export type SeasonStatus = "upcoming" | "active" | "closed";
export type LeagueType = "global" | "private" | "university";

export interface Season {
  readonly id: string;
  readonly name: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly prizePoolEstimate: number;
}

export interface League {
  readonly id: string;
  readonly seasonId: string;
  readonly name: string;
  readonly type: LeagueType;
  readonly memberCount: number;
  readonly inviteCode?: string;
}

export interface LeagueMembership {
  readonly leagueId: string;
  readonly seasonId: string;
  readonly startingBankroll: number;
  readonly currentBankroll: number;
  readonly betCount: number;
  readonly isBust: boolean;
  readonly joinedAt: number;
}

export interface SeasonLeaderboardEntry {
  readonly rank: number;
  readonly displayName: string;
  readonly avatarInitial: string;
  readonly bankroll: number;
  readonly betCount: number;
  readonly isYou?: boolean;
}
