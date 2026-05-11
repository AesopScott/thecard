import type { Sport } from "./market";

export type SeasonStatus = "upcoming" | "active" | "closed";
export type LeagueType = "global" | "sport_season" | "sport_half_season" | "sport_playoffs" | "sport_tournament" | "private" | "university";
export type SportLeagueHalf = "first" | "second";

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

export interface SportLeague {
  readonly id: string;
  readonly sport: Sport;
  readonly name: string;
  readonly description: string;
  readonly type: Extract<LeagueType, "sport_season" | "sport_half_season" | "sport_playoffs" | "sport_tournament">;
  readonly half?: SportLeagueHalf;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly memberCount: number;
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
  readonly uid?: string;
  readonly username?: string;
  readonly displayName: string;
  readonly photoURL?: string | null;
  readonly avatarInitial: string;
  readonly bankroll: number;
  readonly betCount: number;
  readonly isYou?: boolean;
  readonly isPreview?: boolean;
}
