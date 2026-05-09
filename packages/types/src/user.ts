export interface User {
  readonly id: string;
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly kalshiUserId: string | null;
  readonly isVerifiedForecaster: boolean;
  readonly createdAt: Date;
}

export interface ForecasterStats {
  readonly userId: string;
  readonly brierScore: number;
  readonly calibrationScore: number;
  readonly totalPredictions: number;
  readonly resolvedPredictions: number;
  readonly winRate: number;
  readonly totalPnlUsd: number;
  readonly updatedAt: Date;
}
