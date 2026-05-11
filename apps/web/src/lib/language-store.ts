import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { isLocale, type Locale } from "./i18n";

export async function getStoredLanguage(uid: string): Promise<Locale | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, "users", uid));
  const value = snap.data()?.language;
  return isLocale(typeof value === "string" ? value : null) ? value : null;
}

export async function saveStoredLanguage(uid: string, language: Locale): Promise<void> {
  if (!db) return;
  await setDoc(
    doc(db, "users", uid),
    {
      language,
      languageUpdatedAtMs: Date.now(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
