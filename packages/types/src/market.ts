export type Sport =
  | "nfl"
  | "nba"
  | "mlb"
  | "ufc"
  | "ncaaf"
  | "ncaab"
  | "soccer"
  | "other";

export type MarketStatus = "open" | "closed" | "resolved" | "voided";

export type MarketOutcome = "yes" | "no" | "void";

export interface Market {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly sport: Sport;
  readonly status: MarketStatus;
  readonly closesAt: Date;
  readonly resolvedAt: Date | null;
  readonly outcome: MarketOutcome | null;
  readonly externalId: string | null;
}

export interface Odds {
  readonly marketId: string;
  readonly yes: number;
  readonly no: number;
  readonly spread: number;
  readonly timestamp: Date;
}

export interface Order {
  readonly marketId: string;
  readonly side: "yes" | "no";
  readonly amountUsd: number;
  readonly limitPrice?: number;
}

export interface Fill {
  readonly orderId: string;
  readonly marketId: string;
  readonly side: "yes" | "no";
  readonly filledAmountUsd: number;
  readonly price: number;
  readonly timestamp: Date;
}

export interface Position {
  readonly id?: string;
  readonly userId: string;
  readonly marketId: string;
  readonly side: "yes" | "no";
  readonly contracts: number;
  readonly averagePrice: number;
  readonly currentValue: number;
  readonly pnl: number;
}

export interface MarketFilter {
  readonly sport?: Sport;
  readonly status?: MarketStatus;
  readonly limit?: number;
  readonly cursor?: string;
}
