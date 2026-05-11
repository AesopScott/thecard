import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type SupportCategory = "account" | "league" | "billing" | "bug" | "feature" | "other";

export interface SupportRequestInput {
  name: string;
  email: string;
  category: SupportCategory;
  subject: string;
  message: string;
  uid?: string | null;
  username?: string | null;
}

export async function submitSupportRequest(input: SupportRequestInput): Promise<void> {
  if (!db) throw new Error("Support form is unavailable while Firebase is not configured.");
  await addDoc(collection(db, "supportRequests"), {
    ...input,
    status: "new",
    createdAtMs: Date.now(),
    createdAt: serverTimestamp(),
  });
}
