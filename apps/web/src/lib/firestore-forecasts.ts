import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import type { LocalForecast } from "./forecast-store";
import { brierScore as computeBrierScore, calibrationScore } from "@thecard/scoring";

function forecastsCol(uid: string) {
  if (!db) throw new Error("Firestore not configured");
  return collection(db, "users", uid, "forecasts");
}

export async function saveForecastToFirestore(
  uid: string,
  forecast: LocalForecast
): Promise<void> {
  if (!db) return;
  await setDoc(doc(forecastsCol(uid), forecast.marketId), forecast);
}

export async function resolveForecastInFirestore(
  uid: string,
  marketId: string,
  outcome: "yes" | "no",
  brierScore: number
): Promise<void> {
  if (!db) return;
  await updateDoc(doc(forecastsCol(uid), marketId), { outcome, brierScore });

  // Recompute and persist user-level calibration stats for the leaderboard
  const snap = await getDocs(forecastsCol(uid));
  const resolved: Array<{ probability: number; outcome: 0 | 1 }> = [];
  snap.forEach((d) => {
    const data = d.data() as LocalForecast;
    if (data.outcome !== null && data.brierScore !== null) {
      resolved.push({
        probability: data.probability,
        outcome: (data.outcome === "yes" ? 1 : 0) as 0 | 1,
      });
    }
  });
  if (resolved.length > 0 && db) {
    const avgBrier = computeBrierScore(resolved);
    await setDoc(
      doc(db, "users", uid),
      {
        calibrationScore: calibrationScore(avgBrier),
        resolvedCount: resolved.length,
        avgBrierScore: avgBrier,
      },
      { merge: true }
    );
  }
}

export async function loadForecastsFromFirestore(
  uid: string
): Promise<LocalForecast[]> {
  if (!db) return [];
  const snap = await getDocs(forecastsCol(uid));
  return snap.docs.map((d) => d.data() as LocalForecast);
}

export function subscribeForecastsFromFirestore(
  uid: string,
  cb: (forecasts: LocalForecast[]) => void
): Unsubscribe {
  if (!db) return () => {};
  return onSnapshot(forecastsCol(uid), (snap) => {
    cb(snap.docs.map((d) => d.data() as LocalForecast));
  });
}
