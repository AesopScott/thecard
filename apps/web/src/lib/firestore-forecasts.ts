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
