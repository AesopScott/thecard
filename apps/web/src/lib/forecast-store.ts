const STORAGE_KEY = "thecard:forecast:v1";

export interface LocalForecast {
  marketId: string;
  marketTitle: string;
  probability: number; // 0.01–0.99
  createdAt: number;
  outcome: "yes" | "no" | null;
  brierScore: number | null;
}

type ForecastMap = Record<string, LocalForecast>;

export const FORECAST_UPDATED_EVENT = "thecard:forecast:updated";

function read(): ForecastMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as ForecastMap;
  } catch {
    return {};
  }
}

function write(map: ForecastMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(FORECAST_UPDATED_EVENT));
}

export function loadForecasts(): ForecastMap {
  return read();
}

export function addForecast(forecast: Omit<LocalForecast, "outcome" | "brierScore">): void {
  write({ ...read(), [forecast.marketId]: { ...forecast, outcome: null, brierScore: null } });
}

export function resolveForecast(marketId: string, outcome: "yes" | "no"): void {
  const all = read();
  const existing = all[marketId];
  if (!existing || existing.outcome !== null) return;
  const outcomeNum = outcome === "yes" ? 1 : 0;
  const brierScore = Math.pow(existing.probability - outcomeNum, 2);
  write({ ...all, [marketId]: { ...existing, outcome, brierScore } });
}

export function clearForecasts(): void {
  write({});
}
