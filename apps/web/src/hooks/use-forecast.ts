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

const MIN_PREDICTIONS_FOR_SCORE = 5;
// Simulated resolution delay in ms — makes the demo feel alive
const MOCK_RESOLVE_DELAY_MS = 4500;

interface UseForecastReturn {
  forecasts: Record<string, LocalForecast>;
  predict: (marketId: string, marketTitle: string, probability: number) => void;
  hasPredicted: (marketId: string) => boolean;
  calibration: number | null;
  resolvedCount: number;
  predictionsUntilScore: number;
  reset: () => void;
}

export function useForecast(): UseForecastReturn {
  const [forecasts, setForecasts] = useState<Record<string, LocalForecast>>({});

  const refresh = useCallback(() => setForecasts(loadForecasts()), []);

  useEffect(() => {
    refresh();
    window.addEventListener(FORECAST_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(FORECAST_UPDATED_EVENT, refresh);
  }, [refresh]);

  const predict = useCallback(
    (marketId: string, marketTitle: string, probability: number) => {
      addForecast({ marketId, marketTitle, probability, createdAt: Date.now() });

      // Probabilistic mock resolution: outcome weighted by the predicted probability
      setTimeout(() => {
        const outcome: "yes" | "no" = Math.random() < probability ? "yes" : "no";
        resolveForecast(marketId, outcome);
      }, MOCK_RESOLVE_DELAY_MS);
    },
    []
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

  const reset = useCallback(() => {
    clearForecasts();
  }, []);

  return {
    forecasts,
    predict,
    hasPredicted,
    calibration,
    resolvedCount,
    predictionsUntilScore,
    reset,
  };
}
