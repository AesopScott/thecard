"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  type AppTheme,
  getStoredTheme,
  readLocalTheme,
  saveStoredTheme,
  writeLocalTheme,
} from "@/lib/theme-store";

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => Promise<void>;
  syncStatus: "local" | "synced" | "offline";
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, verificationRequired, loading } = useAuth();
  const [theme, setThemeState] = useState<AppTheme>("ticket");
  const [syncStatus, setSyncStatus] = useState<ThemeContextValue["syncStatus"]>("local");

  useEffect(() => {
    const localTheme = readLocalTheme();
    setThemeState(localTheme);
    document.documentElement.dataset.theme = localTheme;
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    writeLocalTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;

    getStoredTheme(user.uid)
      .then((stored) => {
        if (cancelled) return;
        const nextTheme = stored ?? readLocalTheme();
        setThemeState(nextTheme);
        setSyncStatus(stored ? "synced" : "local");
        if (!stored && !verificationRequired) void saveStoredTheme(user.uid, nextTheme);
      })
      .catch(() => {
        if (!cancelled) setSyncStatus("offline");
      });

    return () => {
      cancelled = true;
    };
  }, [loading, user, verificationRequired]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      syncStatus,
      setTheme: async (nextTheme) => {
        setThemeState(nextTheme);
        writeLocalTheme(nextTheme);
        if (user && !verificationRequired) {
          try {
            await saveStoredTheme(user.uid, nextTheme);
            setSyncStatus("synced");
          } catch {
            setSyncStatus("offline");
          }
        } else {
          setSyncStatus("local");
        }
      },
    }),
    [syncStatus, theme, user, verificationRequired]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
