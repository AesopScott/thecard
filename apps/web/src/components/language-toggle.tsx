"use client";

import { useI18n } from "@/contexts/i18n-context";

interface LanguageToggleProps {
  fixed?: boolean;
}

export function LanguageToggle({ fixed = false }: LanguageToggleProps) {
  const { locale, setLocale, t } = useI18n();
  const nextLocale = locale === "en" ? "es" : "en";
  const nextLabel = nextLocale === "en" ? "EN" : "ES";

  return (
    <button
      type="button"
      aria-label={t("language.toggleLabel")}
      title={t("language.toggleLabel")}
      onClick={() => setLocale(nextLocale)}
      className={`${fixed ? "fixed right-16 top-4 z-50" : ""} h-8 rounded-full border border-[var(--color-card-border)] bg-[var(--color-card-surface)] px-3 text-xs font-black text-[var(--color-card-muted)] shadow-sm transition-colors hover:text-[var(--color-card-text)]`}
    >
      {nextLabel}
    </button>
  );
}
