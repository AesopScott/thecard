import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Position } from "@thecard/types";

export interface StoredPosition extends Omit<Position, "userId"> {
  createdAt: ReturnType<typeof serverTimestamp> | number;
}

function positionsCol(uid: string) {
  if (!db) throw new Error("Firestore not configured");
  return collection(db, "users", uid, "positions");
}

export async function savePositionToFirestore(
  uid: string,
  position: Omit<Position, "userId">
): Promise<void> {
  if (!db) return;
  await addDoc(positionsCol(uid), {
    ...position,
    createdAt: serverTimestamp(),
  });
}

export async function loadPositionsFromFirestore(
  uid: string
): Promise<StoredPosition[]> {
  if (!db) return [];
  const snap = await getDocs(positionsCol(uid));
  return snap.docs.map((d) => d.data() as StoredPosition);
}

export function subscribePositionsFromFirestore(
  uid: string,
  cb: (positions: StoredPosition[]) => void
): Unsubscribe {
  if (!db) return () => {};
  return onSnapshot(positionsCol(uid), (snap) => {
    cb(snap.docs.map((d) => d.data() as StoredPosition));
  });
}
