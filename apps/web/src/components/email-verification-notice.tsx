"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";

interface EmailVerificationNoticeProps {
  compact?: boolean;
}

export function EmailVerificationNotice({ compact = false }: EmailVerificationNoticeProps) {
  const { user, verificationRequired, sendVerificationEmail, refreshUser, signOut } = useAuth();
  const { t } = useI18n();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState<"send" | "refresh" | null>(null);

  if (!user || !verificationRequired) return null;

  async function handleSend() {
    setBusy("send");
    setStatus(null);
    try {
      await sendVerificationEmail();
      setStatus(t("verify.sent"));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t("verify.sendFailed"));
    } finally {
      setBusy(null);
    }
  }

  async function handleRefresh() {
    setBusy("refresh");
    setStatus(null);
    try {
      await refreshUser();
      setStatus(t("verify.refreshed"));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t("verify.refreshFailed"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={compact ? "rounded-xl border border-[var(--color-brand-primary)]/40 bg-[var(--color-card-surface)] p-4" : "fixed left-4 right-4 top-16 z-40 mx-auto max-w-lg rounded-xl border border-[var(--color-brand-primary)]/40 bg-[var(--color-card-surface)] p-4 shadow-lg"}>
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-black text-[var(--color-card-text)]">{t("verify.title")}</p>
          <p className="mt-1 text-xs text-[var(--color-card-muted)]">
            {t("verify.bodyPrefix")} {user.email}. {t("verify.bodySuffix")}
          </p>
        </div>
        {status && <p className="text-xs text-[var(--color-brand-primary)]">{status}</p>}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSend}
            disabled={busy !== null}
            className="rounded-lg bg-[var(--color-brand-primary)] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            {busy === "send" ? t("verify.sending") : t("verify.resend")}
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={busy !== null}
            className="rounded-lg border border-[var(--color-card-border)] px-3 py-2 text-xs font-bold text-[var(--color-card-text)] disabled:opacity-50"
          >
            {busy === "refresh" ? t("verify.checking") : t("verify.iVerified")}
          </button>
          <button
            type="button"
            onClick={signOut}
            className="rounded-lg px-3 py-2 text-xs font-bold text-[var(--color-card-muted)] hover:text-[var(--color-card-text)]"
          >
            {t("account.signOut")}
          </button>
        </div>
      </div>
    </div>
  );
}
