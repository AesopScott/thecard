"use client";

import Link from "next/link";
import { useI18n } from "@/contexts/i18n-context";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-5 px-5 text-center">
        <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">404</p>
        <h1 className="text-3xl font-black">{t("notFound.title")}</h1>
        <p className="text-sm leading-6 text-[var(--color-text-muted)]">
          {t("notFound.body")}
        </p>
        <Link
          href="/card"
          className="rounded-xl bg-[var(--color-brand-primary)] px-5 py-3 text-sm font-black text-white transition hover:bg-red-500"
        >
          {t("notFound.back")}
        </Link>
      </div>
    </main>
  );
}
