import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export const CARD_WATCHLIST_KEY = "thecard:watchlist:v1";
const WATCHLIST_DOC_ID = "default";

function normalizeMarketIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((item): item is string => typeof item === "string" && item.length > 0)));
}

export function readLocalCardWatchlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return normalizeMarketIds(JSON.parse(localStorage.getItem(CARD_WATCHLIST_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

export function writeLocalCardWatchlist(marketIds: string[]): string[] {
  const normalized = normalizeMarketIds(marketIds);
  if (typeof window !== "undefined") {
    localStorage.setItem(CARD_WATCHLIST_KEY, JSON.stringify(normalized));
  }
  return normalized;
}

export async function getStoredCardWatchlist(uid: string): Promise<string[]> {
  const local = readLocalCardWatchlist();
  if (!db) return local;

  const snap = await getDoc(doc(db, "users", uid, "cardWatchlist", WATCHLIST_DOC_ID));
  if (!snap.exists()) return local;

  const remote = normalizeMarketIds(snap.data().marketIds);
  const merged = writeLocalCardWatchlist([...local, ...remote]);
  return merged;
}

export async function saveCardWatchlist(uid: string, marketIds: string[]): Promise<string[]> {
  const normalized = writeLocalCardWatchlist(marketIds);
  if (!db) return normalized;

  await setDoc(
    doc(db, "users", uid, "cardWatchlist", WATCHLIST_DOC_ID),
    {
      marketIds: normalized,
      updatedAtMs: Date.now(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return normalized;
}
