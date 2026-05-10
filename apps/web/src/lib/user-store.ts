import {
  doc,
  setDoc,
  collection,
  onSnapshot,
  addDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  getDocs,
  updateDoc,
  writeBatch,
  type Timestamp,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "./firebase";
import type { LocalForecast } from "./forecast-store";
import { brierScore as computeBrierScore, calibrationScore } from "@thecard/scoring";
import type { Position } from "@thecard/types";

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL: string | null;
  calibrationScore: number;
  resolvedCount: number;
}

// ─── User profile ────────────────────────────────────────────────────────────

export async function upsertUserProfile(user: User): Promise<void> {
  if (!db) return;
  await setDoc(
    doc(db, "users", user.uid),
    {
      displayName: user.displayName ?? null,
      email: user.email ?? null,
      photoURL: user.photoURL ?? null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// ─── Forecasts ────────────────────────────────────────────────────────────────

function toLocalForecast(id: string, data: Record<string, unknown>): LocalForecast {
  return {
    marketId: id,
    marketTitle: data.marketTitle as string,
    probability: data.probability as number,
    createdAt: (data.createdAt as Timestamp | null)?.toMillis() ?? Date.now(),
    outcome: (data.outcome as "yes" | "no" | null) ?? null,
    brierScore: (data.brierScore as number | null) ?? null,
  };
}

export function subscribeToForecasts(
  uid: string,
  cb: (map: Record<string, LocalForecast>) => void
): () => void {
  if (!db) return () => {};
  return onSnapshot(collection(db, "users", uid, "forecasts"), (snap) => {
    const map: Record<string, LocalForecast> = {};
    snap.forEach((d) => {
      map[d.id] = toLocalForecast(d.id, d.data());
    });
    cb(map);
  });
}

export async function saveForecast(
  uid: string,
  forecast: Omit<LocalForecast, "outcome" | "brierScore">
): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, "users", uid, "forecasts", forecast.marketId), {
    marketTitle: forecast.marketTitle,
    probability: forecast.probability,
    createdAt: serverTimestamp(),
    outcome: null,
    brierScore: null,
  });
}

export async function resolveFirestoreForecast(
  uid: string,
  marketId: string,
  outcome: "yes" | "no"
): Promise<void> {
  if (!db) return;

  const forecastRef = doc(db, "users", uid, "forecasts", marketId);
  const snap = await getDocs(collection(db, "users", uid, "forecasts"));

  let probability = 0.5;
  const allForecasts: LocalForecast[] = [];

  snap.forEach((d) => {
    const data = d.data();
    const isThis = d.id === marketId;
    if (isThis) probability = data.probability as number;
    allForecasts.push(
      toLocalForecast(d.id, {
        ...data,
        outcome: isThis ? outcome : data.outcome,
        brierScore: isThis
          ? Math.pow((data.probability as number) - (outcome === "yes" ? 1 : 0), 2)
          : data.brierScore,
      })
    );
  });

  const thisBrierScore = Math.pow(probability - (outcome === "yes" ? 1 : 0), 2);
  await updateDoc(forecastRef, { outcome, brierScore: thisBrierScore });

  // Recompute and persist user-level stats
  const resolved = allForecasts.filter((f) => f.outcome !== null && f.brierScore !== null);
  if (resolved.length > 0) {
    const avgBrier = computeBrierScore(
      resolved.map((f) => ({
        probability: f.probability,
        outcome: (f.outcome === "yes" ? 1 : 0) as 0 | 1,
      }))
    );
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

export async function clearFirestoreForecasts(uid: string): Promise<void> {
  if (!db) return;
  const snap = await getDocs(collection(db, "users", uid, "forecasts"));
  const batch = writeBatch(db);
  snap.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  await setDoc(
    doc(db, "users", uid),
    { calibrationScore: 0, resolvedCount: 0, avgBrierScore: 0 },
    { merge: true }
  );
}

// ─── Positions ────────────────────────────────────────────────────────────────

export async function savePosition(
  uid: string,
  data: {
    marketId: string;
    side: "yes" | "no";
    amountUsd: number;
    contracts: number;
    averagePrice: number;
  }
): Promise<void> {
  if (!db) return;
  await addDoc(collection(db, "users", uid, "positions"), {
    ...data,
    placedAt: serverTimestamp(),
  });
}

export function subscribeToPositions(
  uid: string,
  cb: (positions: Position[]) => void
): () => void {
  if (!db) return () => {};
  const q = query(
    collection(db, "users", uid, "positions"),
    orderBy("placedAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          userId: uid,
          marketId: data.marketId as string,
          side: data.side as "yes" | "no",
          contracts: data.contracts as number,
          averagePrice: data.averagePrice as number,
          currentValue: (data.contracts as number) * (data.averagePrice as number),
          pnl: 0,
        };
      })
    );
  });
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export function subscribeToLeaderboard(
  cb: (entries: LeaderboardEntry[]) => void
): () => void {
  if (!db) return () => {};
  const q = query(collection(db, "users"), limit(100));
  return onSnapshot(q, (snap) => {
    const entries: LeaderboardEntry[] = [];
    snap.forEach((d) => {
      const data = d.data();
      if ((data.resolvedCount as number | undefined ?? 0) >= 5) {
        entries.push({
          uid: d.id,
          displayName: (data.displayName as string | null) ?? "Anonymous",
          photoURL: (data.photoURL as string | null) ?? null,
          calibrationScore: (data.calibrationScore as number | undefined) ?? 0,
          resolvedCount: (data.resolvedCount as number | undefined) ?? 0,
        });
      }
    });
    entries.sort((a, b) => b.calibrationScore - a.calibrationScore);
    cb(entries);
  });
}
