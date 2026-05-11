"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
import { submitSupportRequest, type SupportCategory } from "@/lib/support-store";
import type { TranslationKey } from "@/lib/i18n";

const CATEGORIES: { value: SupportCategory; labelKey: TranslationKey }[] = [
  { value: "account", labelKey: "support.category.account" },
  { value: "league", labelKey: "support.category.league" },
  { value: "billing", labelKey: "support.category.billing" },
  { value: "bug", labelKey: "support.category.bug" },
  { value: "feature", labelKey: "support.category.feature" },
  { value: "other", labelKey: "support.category.other" },
];

export function SupportClient() {
  const { user, username } = useAuth();
  const { t } = useI18n();
  const [name, setName] = useState(username ?? user?.displayName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [category, setCategory] = useState<SupportCategory>("account");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !subject.trim() || !message.trim()) {
      setError(t("support.requiredError"));
      return;
    }
    setStatus("sending");
    setError(null);
    try {
      await submitSupportRequest({
        name: name.trim(),
        email: email.trim(),
        category,
        subject: subject.trim(),
        message: message.trim(),
        uid: user?.uid ?? null,
        username,
      });
      setStatus("sent");
      setSubject("");
      setMessage("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : t("support.genericError"));
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] px-4 pb-32 pt-8 text-[var(--color-text-primary)]">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <Link href={username ? `/profile?u=${encodeURIComponent(username)}` : "/card"} className="text-sm font-bold text-[var(--color-brand-primary)] hover:underline">
          {t("support.back")}
        </Link>

        <header className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("support.title")}</p>
          <h1 className="mt-2 font-display text-3xl font-black text-[var(--color-card-text)] sm:text-4xl">{t("support.heading")}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-card-muted)]">
            {t("support.intro")}
          </p>
        </header>

        {status === "sent" && (
          <div className="rounded-xl border border-[var(--color-card-yes)]/30 bg-[var(--color-card-yes-dim)] p-4">
            <p className="text-sm font-black text-[var(--color-card-text)]">{t("support.sentTitle")}</p>
            <p className="mt-1 text-xs text-[var(--color-card-muted)]">{t("support.sentBody")}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("support.name")}>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-11 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] px-3 text-sm font-bold text-[var(--color-card-text)] outline-none focus:border-[var(--color-brand-primary)]"
              />
            </Field>
            <Field label={t("auth.email")}>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="h-11 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] px-3 text-sm font-bold text-[var(--color-card-text)] outline-none focus:border-[var(--color-brand-primary)]"
              />
            </Field>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-[220px_1fr]">
            <Field label={t("support.category")}>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as SupportCategory)}
                className="h-11 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] px-3 text-sm font-bold text-[var(--color-card-text)] outline-none focus:border-[var(--color-brand-primary)]"
              >
                {CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>{t(item.labelKey)}</option>
                ))}
              </select>
            </Field>
            <Field label={t("support.subject")}>
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                required
                maxLength={120}
                placeholder={t("support.subjectPlaceholder")}
                className="h-11 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] px-3 text-sm font-bold text-[var(--color-card-text)] outline-none placeholder:text-[var(--color-card-muted)] focus:border-[var(--color-brand-primary)]"
              />
            </Field>
          </div>

          <Field label={t("support.message")} className="mt-4">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
              rows={8}
              placeholder={t("support.messagePlaceholder")}
              className="w-full resize-none rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] px-3 py-3 text-sm font-semibold leading-relaxed text-[var(--color-card-text)] outline-none placeholder:text-[var(--color-card-muted)] focus:border-[var(--color-brand-primary)]"
            />
          </Field>

          {error && <p className="mt-4 rounded-lg border border-[var(--color-card-no)]/30 bg-[var(--color-card-no-dim)] px-3 py-2 text-xs font-bold text-[var(--color-card-text)]">{error}</p>}

          <button
            type="submit"
            disabled={status === "sending"}
            className="mt-5 w-full rounded-xl bg-[var(--color-brand-primary)] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
          >
            {status === "sending" ? t("support.sending") : t("support.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-card-muted)]">{label}</span>
      {children}
    </label>
  );
}
