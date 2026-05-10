"use client";

import { useCallback, useEffect, useState } from "react";
import { brierScore, calibrationScore } from "@thecard/scoring";
import {
  addForecast,
  clearForecasts,
  FORECAST_UPDATED_EVENT,
  loadForecasts,
  resolveForecast,
  type LocalForecast,
} from "@/lib/forecast-store";
import {
  saveForecast,
  resolveFirestoreForecast,
  subscribeToForecasts,
  clearFirestoreForecasts,
} from "@/lib/user-store";
import { useAuth } from "@/contexts/auth-context";

const MIN_PREDICTIONS_FOR_SCORE = 5;
const MOCK_RESOLVE_DELAY_MS = 4500;

interface UseForecastReturn {
  forecasts: Record<string, LocalForecast>;
  predict: (marketId: string, marketTitle: string, probability: number, crowdProbability?: number) => void;
  hasPredicted: (marketId: string) => boolean;
  calibration: number | null;
  resolvedCount: number;
  predictionsUntilScore: number;
  streak: number;
  reset: () => void;
}

export function useForecast(): UseForecastReturn {
  const { user } = useAuth();
  const [forecasts, setForecasts] = useState<Record<string, LocalForecast>>({});

  // Seed from localStorage on mount
  const refresh = useCallback(() => setForecasts(loadForecasts()), []);

  useEffect(() => {
    refresh();
    window.addEventListener(FORECAST_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(FORECAST_UPDATED_EVENT, refresh);
  }, [refresh]);

  // When signed in, subscribe to Firestore and merge into local state
  useEffect(() => {
    if (!user) return;
    return subscribeToForecasts(user.uid, (remote) => {
      // Write-through to localStorage so the app works offline
      const local = loadForecasts();
      const merged = { ...local, ...remote };
      localStorage.setItem("thecard:forecast:v1", JSON.stringify(merged));
      setForecasts(merged);
    });
  }, [user]);

  const predict = useCallback(
    (marketId: string, marketTitle: string, probability: number, crowdProbability?: number) => {
      // Write locally immediately for instant UI response
      addForecast({ marketId, marketTitle, probability, crowdProbability, createdAt: Date.now() });

      if (user) {
        saveForecast(user.uid, {
          marketId,
          marketTitle,
          probability,
          createdAt: Date.now(),
        }).catch(() => {});
      }

      // Probabilistic mock resolution weighted by predicted probability
      setTimeout(() => {
        const outcome: "yes" | "no" = Math.random() < probability ? "yes" : "no";
        resolveForecast(marketId, outcome);
        if (user) {
          resolveFirestoreForecast(user.uid, marketId, outcome).catch(() => {});
        }
      }, MOCK_RESOLVE_DELAY_MS);
    },
    [user]
  );

  const hasPredicted = useCallback(
    (marketId: string) => marketId in forecasts,
    [forecasts]
  );

  const resolved = Object.values(forecasts).filter((f) => f.outcome !== null);
  const resolvedCount = resolved.length;

  const calibration =
    resolvedCount >= MIN_PREDICTIONS_FOR_SCORE
      ? calibrationScore(
          brierScore(
            resolved.map((f) => ({
              probability: f.probability,
              outcome: (f.outcome === "yes" ? 1 : 0) as 0 | 1,
            }))
          )
        )
      : null;

  const predictionsUntilScore = Math.max(0, MIN_PREDICTIONS_FOR_SCORE - resolvedCount);

  const streak = calcStreak(forecasts);

  const reset = useCallback(() => {
    clearForecasts();
    if (user) clearFirestoreForecasts(user.uid).catch(() => {});
  }, [user]);

  return {
    forecasts,
    predict,
    hasPredicted,
    calibration,
    resolvedCount,
    predictionsUntilScore,
    streak,
    reset,
  };
}

function calcStreak(forecasts: Record<string, LocalForecast>): number {
  const days = new Set(
    Object.values(forecasts).map((f) => new Date(f.createdAt).toDateString())
  );
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const startOffset = days.has(today.toDateString())
    ? 0
    : days.has(yesterday.toDateString())
    ? 1
    : null;
  if (startOffset === null) return 0;
  let count = 0;
  for (let i = startOffset; ; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (days.has(d.toDateString())) count++;
    else break;
  }
  return count;
}
