import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export const THEME_KEY = "thecard:theme:v1";
export const THEMES = ["ticket", "ice", "mint", "ink"] as const;
export type AppTheme = (typeof THEMES)[number];

export const THEME_LABELS: Record<AppTheme, string> = {
  ticket: "Paper Ticket",
  ice: "Ice Cards",
  mint: "Mint Board",
  ink: "Opaque Ink",
};

export function isAppTheme(value: unknown): value is AppTheme {
  return typeof value === "string" && THEMES.includes(value as AppTheme);
}

export function readLocalTheme(): AppTheme {
  if (typeof window === "undefined") return "ticket";
  const value = localStorage.getItem(THEME_KEY);
  return isAppTheme(value) ? value : "ticket";
}

export function writeLocalTheme(theme: AppTheme) {
  if (typeof window !== "undefined") localStorage.setItem(THEME_KEY, theme);
}

export async function getStoredTheme(uid: string): Promise<AppTheme | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, "users", uid));
  const value = snap.data()?.theme;
  return isAppTheme(value) ? value : null;
}

export async function saveStoredTheme(uid: string, theme: AppTheme): Promise<void> {
  if (!db) return;
  await setDoc(
    doc(db, "users", uid),
    {
      theme,
      themeUpdatedAtMs: Date.now(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
