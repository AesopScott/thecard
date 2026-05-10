import {
  doc,
  getDoc,
  setDoc,
  collection,
  onSnapshot,
  addDoc,
  query,
  orderBy,
  where,
  limit,
  serverTimestamp,
  getDocs,
  updateDoc,
  writeBatch,
  type Timestamp,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import type { LocalForecast } from "./forecast-store";
import { brierScore as computeBrierScore, calibrationScore } from "@thecard/scoring";
import type { Position } from "@thecard/types";
import type { Sport } from "@thecard/types";

export interface LeaderboardEntry {
  uid: string;
  username: string;
  displayName: string;
  photoURL: string | null;
  calibrationScore: number;
  resolvedCount: number;
  teamName: string | null;
  emailVerified: boolean;
}

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  photoURL: string | null;
  calibrationScore: number;
  resolvedCount: number;
  avgBrierScore: number | null;
  teamName: string | null;
  emailVerified: boolean;
}

export interface SettledPositionRecord {
  id: string;
  marketId: string;
  marketTitle: string;
  sport: Sport;
  side: "yes" | "no";
  contracts: number;
  averagePrice: number;
  costBasis: number;
  payout: number;
  pnl: number;
  outcome: "yes" | "no" | "sold";
  openedAtMs: number;
  closedAtMs: number;
}

// ─── User profile ────────────────────────────────────────────────────────────

export async function getUserUsername(uid: string): Promise<string | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, "users", uid));
  return (snap.data()?.username as string | undefined) ?? null;
}

export async function getUserProfileByUsername(username: string): Promise<UserProfile | null> {
  if (!db) return null;
  const normalized = username.toLowerCase();
  const usernameSnap = await getDoc(doc(db, "usernames", normalized));
  const uid = usernameSnap.data()?.uid as string | undefined;
  if (!uid) return null;

  const userSnap = await getDoc(doc(db, "users", uid));
  if (!userSnap.exists()) return null;
  const data = userSnap.data();
  const profileUsername = (data.username as string | undefined) ?? normalized;

  return {
    uid,
    username: profileUsername,
    displayName: (data.displayName as string | null) ?? profileUsername,
    photoURL: (data.photoURL as string | null) ?? null,
    calibrationScore: (data.calibrationScore as number | undefined) ?? 0,
    resolvedCount: (data.resolvedCount as number | undefined) ?? 0,
    avgBrierScore: (data.avgBrierScore as number | undefined) ?? null,
    teamName: (data.teamName as string | null) ?? null,
    emailVerified: (data.emailVerified as boolean | undefined) ?? false,
  };
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  if (!db) return true;
  const snap = await getDoc(doc(db, "usernames", username.toLowerCase()));
  return !snap.exists();
}

export async function setUsername(uid: string, username: string): Promise<void> {
  if (!db) return;
  const normalized = username.toLowerCase();
  await setDoc(doc(db, "usernames", normalized), { uid });
  await setDoc(doc(db, "users", uid), { username: normalized, displayName: normalized }, { merge: true });
}

export async function upsertUserProfile(user: User): Promise<void> {
  if (!db) return;
  await setDoc(
    doc(db, "users", user.uid),
    {
      email: user.email ?? null,
      emailVerified: user.emailVerified,
      ...(user.displayName && { displayName: user.displayName }),
      ...(user.photoURL && { photoURL: user.photoURL }),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function uploadAvatar(uid: string, file: File): Promise<string> {
  if (!storage || !db) throw new Error("Firebase not configured");
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const r = ref(storage, `avatars/${uid}/profile-${Date.now()}.${extension}`);
  await uploadBytes(r, file, { contentType: file.type || "image/jpeg" });
  const url = await getDownloadURL(r);
  await setDoc(doc(db, "users", uid), { photoURL: url }, { merge: true });
  return url;
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
  const forecastSnap = await getDoc(forecastRef);
  if (!forecastSnap.exists()) return;

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
    marketTitle?: string;
    sport?: Sport;
    side: "yes" | "no";
    amountUsd: number;
    contracts: number;
    averagePrice: number;
    leagueIds?: string[];
  }
): Promise<void> {
  if (!db) return;
  const now = Date.now();
  const positionsRef = collection(db, "users", uid, "positions");
  const existing = await getDocs(query(
    positionsRef,
    where("marketId", "==", data.marketId),
    where("side", "==", data.side),
    limit(1),
  ));

  if (!existing.empty) {
    const positionDoc = existing.docs[0]!;
    const current = positionDoc.data();
    const currentContracts = (current.contracts as number | undefined) ?? 0;
    const currentAveragePrice = (current.averagePrice as number | undefined) ?? data.averagePrice;
    const nextContracts = currentContracts + data.contracts;
    const nextAmountUsd = ((current.amountUsd as number | undefined) ?? (currentContracts * currentAveragePrice)) + data.amountUsd;
    const nextAveragePrice = nextContracts > 0
      ? ((currentContracts * currentAveragePrice) + (data.contracts * data.averagePrice)) / nextContracts
      : data.averagePrice;

    await updateDoc(positionDoc.ref, {
      amountUsd: nextAmountUsd,
      contracts: nextContracts,
      averagePrice: nextAveragePrice,
      ...(data.marketTitle && { marketTitle: data.marketTitle }),
      ...(data.sport && { sport: data.sport }),
      openedAtMs: (current.openedAtMs as number | undefined) ?? now,
      lastTradeAtMs: now,
      leagueIds: Array.from(new Set([
        ...((current.leagueIds as string[] | undefined) ?? []),
        ...(data.leagueIds ?? []),
      ])),
      updatedAt: serverTimestamp(),
    });
    return;
  }

  await addDoc(positionsRef, {
    ...data,
    openedAtMs: now,
    lastTradeAtMs: now,
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
        const contracts = data.contracts as number;
        const averagePrice = data.averagePrice as number;
        return {
          id: d.id,
          userId: uid,
          marketId: data.marketId as string,
          side: data.side as "yes" | "no",
          contracts,
          averagePrice,
          currentValue: contracts * averagePrice,
          pnl: 0,
        };
      })
    );
  });
}

export async function consolidatePositions(uid: string): Promise<void> {
  if (!db) return;
  const snap = await getDocs(query(
    collection(db, "users", uid, "positions"),
    orderBy("placedAt", "desc")
  ));
  const groups = new Map<string, typeof snap.docs>();

  for (const positionDoc of snap.docs) {
    const data = positionDoc.data();
    const marketId = data.marketId as string | undefined;
    const side = data.side as "yes" | "no" | undefined;
    if (!marketId || !side) continue;
    const key = `${marketId}:${side}`;
    groups.set(key, [...(groups.get(key) ?? []), positionDoc]);
  }

  const batch = writeBatch(db);
  let changed = false;

  for (const docs of groups.values()) {
    if (docs.length < 2) continue;
    const [primary, ...duplicates] = docs;
    if (!primary) continue;
    const aggregate = docs.reduce(
      (acc, positionDoc) => {
        const data = positionDoc.data();
        const contracts = (data.contracts as number | undefined) ?? 0;
        const averagePrice = (data.averagePrice as number | undefined) ?? 0;
        const amountUsd = (data.amountUsd as number | undefined) ?? contracts * averagePrice;
        return {
          contracts: acc.contracts + contracts,
          amountUsd: acc.amountUsd + amountUsd,
          costBasis: acc.costBasis + contracts * averagePrice,
          openedAtMs: Math.min(acc.openedAtMs, (data.openedAtMs as number | undefined) ?? Date.now()),
          lastTradeAtMs: Math.max(acc.lastTradeAtMs, (data.lastTradeAtMs as number | undefined) ?? Date.now()),
        };
      },
      { contracts: 0, amountUsd: 0, costBasis: 0, openedAtMs: Number.POSITIVE_INFINITY, lastTradeAtMs: 0 }
    );

    batch.update(primary.ref, {
      amountUsd: aggregate.amountUsd,
      contracts: aggregate.contracts,
      averagePrice: aggregate.contracts > 0 ? aggregate.costBasis / aggregate.contracts : 0,
      openedAtMs: Number.isFinite(aggregate.openedAtMs) ? aggregate.openedAtMs : Date.now(),
      lastTradeAtMs: aggregate.lastTradeAtMs || Date.now(),
      updatedAt: serverTimestamp(),
    });
    duplicates.forEach((positionDoc) => batch.delete(positionDoc.ref));
    changed = true;
  }

  if (changed) await batch.commit();
}

export async function closePosition(uid: string, positionId: string): Promise<void> {
  if (!db) return;
  const { deleteDoc } = await import("firebase/firestore");
  await deleteDoc(doc(db, "users", uid, "positions", positionId));
}

export async function closeMatchingPositions(
  uid: string,
  marketId: string,
  side: "yes" | "no",
  settlement?: {
    marketTitle: string;
    sport: Sport;
    payout: number;
    outcome: "sold";
  }
): Promise<void> {
  if (!db) return;
  const snap = await getDocs(query(
    collection(db, "users", uid, "positions"),
    where("marketId", "==", marketId),
    where("side", "==", side),
  ));
  if (snap.empty) return;
  const batch = writeBatch(db);
  if (settlement) {
    const aggregate = snap.docs.reduce(
      (acc, positionDoc) => {
        const data = positionDoc.data();
        const contracts = (data.contracts as number | undefined) ?? 0;
        const averagePrice = (data.averagePrice as number | undefined) ?? 0;
        const amountUsd = (data.amountUsd as number | undefined) ?? contracts * averagePrice;
        return {
          contracts: acc.contracts + contracts,
          costBasis: acc.costBasis + amountUsd,
          weightedPrice: acc.weightedPrice + contracts * averagePrice,
          openedAtMs: Math.min(acc.openedAtMs, (data.openedAtMs as number | undefined) ?? Date.now()),
        };
      },
      { contracts: 0, costBasis: 0, weightedPrice: 0, openedAtMs: Number.POSITIVE_INFINITY }
    );
    const closedAtMs = Date.now();
    batch.set(doc(collection(db, "users", uid, "settledPositions")), {
      marketId,
      marketTitle: settlement.marketTitle,
      sport: settlement.sport,
      side,
      contracts: aggregate.contracts,
      averagePrice: aggregate.contracts > 0 ? aggregate.weightedPrice / aggregate.contracts : 0,
      costBasis: aggregate.costBasis,
      payout: settlement.payout,
      pnl: settlement.payout - aggregate.costBasis,
      outcome: settlement.outcome,
      openedAtMs: Number.isFinite(aggregate.openedAtMs) ? aggregate.openedAtMs : closedAtMs,
      closedAtMs,
      closedAt: serverTimestamp(),
    });
  }
  snap.docs.forEach((positionDoc) => batch.delete(positionDoc.ref));
  await batch.commit();
}

export async function getPublicSettledPositions(uid: string, max = 50): Promise<SettledPositionRecord[]> {
  if (!db) return [];
  const snap = await getDocs(query(
    collection(db, "users", uid, "settledPositions"),
    orderBy("closedAtMs", "desc"),
    limit(max),
  ));
  return snap.docs.map((positionDoc) => {
    const data = positionDoc.data();
    return {
      id: positionDoc.id,
      marketId: data.marketId as string,
      marketTitle: (data.marketTitle as string | undefined) ?? (data.marketId as string),
      sport: (data.sport as Sport | undefined) ?? "other",
      side: data.side as "yes" | "no",
      contracts: (data.contracts as number | undefined) ?? 0,
      averagePrice: (data.averagePrice as number | undefined) ?? 0,
      costBasis: (data.costBasis as number | undefined) ?? 0,
      payout: (data.payout as number | undefined) ?? 0,
      pnl: (data.pnl as number | undefined) ?? 0,
      outcome: (data.outcome as "yes" | "no" | "sold" | undefined) ?? "sold",
      openedAtMs: (data.openedAtMs as number | undefined) ?? (data.closedAtMs as number | undefined) ?? Date.now(),
      closedAtMs: (data.closedAtMs as number | undefined) ?? Date.now(),
    };
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
          username: (data.username as string | undefined) ?? d.id,
          displayName: (data.displayName as string | null) ?? (data.username as string | undefined) ?? "Anonymous",
          photoURL: (data.photoURL as string | null) ?? null,
          calibrationScore: (data.calibrationScore as number | undefined) ?? 0,
          resolvedCount: (data.resolvedCount as number | undefined) ?? 0,
          teamName: (data.teamName as string | null) ?? null,
          emailVerified: (data.emailVerified as boolean | undefined) ?? false,
        });
      }
    });
    entries.sort((a, b) => b.calibrationScore - a.calibrationScore);
    cb(entries);
  });
}
