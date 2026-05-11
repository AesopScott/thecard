"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { DEFAULT_LOCALE, DICTIONARY, isLocale, LOCALE_STORAGE_KEY, type Locale, type TranslationKey } from "@/lib/i18n";
import { getStoredLanguage, saveStoredLanguage } from "@/lib/language-store";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function readLocalLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (isLocale(stored)) return stored;
  const browserLocale = window.navigator.language?.slice(0, 2);
  return isLocale(browserLocale) ? browserLocale : DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const localLocale = readLocalLocale();
    setLocaleState(localLocale);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getStoredLanguage(user.uid)
      .then((storedLocale) => {
        if (!cancelled && storedLocale) setLocaleState(storedLocale);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [user]);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    if (user) {
      saveStoredLanguage(user.uid, nextLocale).catch((error) => {
        console.warn("Language preference sync failed:", error);
      });
    }
  }, [user]);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale,
    t: (key) => DICTIONARY[locale][key] ?? DICTIONARY.en[key],
  }), [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
