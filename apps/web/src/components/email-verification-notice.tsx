"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";

interface EmailVerificationNoticeProps {
  compact?: boolean;
}

export function EmailVerificationNotice({ compact = false }: EmailVerificationNoticeProps) {
  const { user, verificationRequired, sendVerificationEmail, refreshUser, signOut } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState<"send" | "refresh" | null>(null);

  if (!user || !verificationRequired) return null;

  async function handleSend() {
    setBusy("send");
    setStatus(null);
    try {
      await sendVerificationEmail();
      setStatus("Verification email sent.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send verification email.");
    } finally {
      setBusy(null);
    }
  }

  async function handleRefresh() {
    setBusy("refresh");
    setStatus(null);
    try {
      await refreshUser();
      setStatus("Verification status refreshed.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not refresh verification status.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={compact ? "rounded-xl border border-[var(--color-brand-primary)]/40 bg-[var(--color-card-surface)] p-4" : "fixed left-4 right-4 top-16 z-40 mx-auto max-w-lg rounded-xl border border-[var(--color-brand-primary)]/40 bg-[var(--color-card-surface)] p-4 shadow-lg"}>
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-black text-[var(--color-card-text)]">Verify your email to keep playing</p>
          <p className="mt-1 text-xs text-[var(--color-card-muted)]">
            We sent a verification link to {user.email}. You can browse, but picks, uploads, teams, and onboarding are locked until verification is complete.
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
            {busy === "send" ? "Sending..." : "Resend email"}
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={busy !== null}
            className="rounded-lg border border-[var(--color-card-border)] px-3 py-2 text-xs font-bold text-[var(--color-card-text)] disabled:opacity-50"
          >
            {busy === "refresh" ? "Checking..." : "I verified"}
          </button>
          <button
            type="button"
            onClick={signOut}
            className="rounded-lg px-3 py-2 text-xs font-bold text-[var(--color-card-muted)] hover:text-[var(--color-card-text)]"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
