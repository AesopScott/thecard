export type ForecastMode = "play_money" | "real_money";

export interface ForecastEntry {
  readonly id: string;
  readonly userId: string;
  readonly marketId: string;
  readonly mode: ForecastMode;
  readonly predictedProbability: number;
  readonly stakeUsd: number;
  readonly actualOutcome: "yes" | "no" | null;
  readonly brierScore: number | null;
  readonly pnlUsd: number | null;
  readonly createdAt: Date;
  readonly resolvedAt: Date | null;
}
