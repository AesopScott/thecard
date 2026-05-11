"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { SignInSheet } from "./sign-in-sheet";
import { ThemePicker } from "./theme-picker";

export function UserButton() {
  const { user, username, emailVerified, verificationRequired, loading, signOut } = useAuth();
  const [signInOpen, setSignInOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) return null;

  if (!user) {
    return (
      <>
        <button
          onClick={() => setSignInOpen(true)}
          className="fixed top-4 right-4 z-50 rounded-full border border-[var(--color-card-border)] bg-[var(--color-card-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-card-muted)] hover:text-[var(--color-card-text)] transition-colors"
        >
          Sign in
        </button>
        <SignInSheet open={signInOpen} onClose={() => setSignInOpen(false)} />
      </>
    );
  }

  const displayName = username ? `@${username}` : user.displayName ?? user.email ?? "Forecaster";
  const initial = username?.[0]?.toUpperCase() ?? user.displayName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "?";
  const profileHref = username ? `/profile?u=${encodeURIComponent(username)}` : "/card";

  return (
    <>
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="fixed top-4 right-4 z-30 w-8 h-8 rounded-full bg-[var(--color-card-accent)] flex items-center justify-center text-white text-xs font-black shadow-sm"
        aria-label="Account"
      >
        {initial}
      </button>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed top-14 right-4 z-40 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] shadow-lg p-1 min-w-[190px]">
            <div className="px-3 py-2 border-b border-[var(--color-card-border)] mb-1">
              <p className="text-xs font-semibold text-[var(--color-card-text)] truncate">
                {displayName}
              </p>
              <p className="text-[10px] text-[var(--color-card-muted)] truncate">{user.email}</p>
              <p className={verificationRequired ? "mt-1 text-[10px] font-bold text-[var(--color-brand-primary)]" : "mt-1 text-[10px] text-[var(--color-card-muted)]"}>
                {emailVerified ? "Verified forecaster" : "Email verification needed"}
              </p>
            </div>
            <Link
              href={profileHref}
              onClick={() => setMenuOpen(false)}
              className="block w-full text-left px-3 py-2 text-xs text-[var(--color-card-muted)] hover:text-[var(--color-card-text)] rounded-lg transition-colors"
            >
              {username ? "View profile" : "Finish setup"}
            </Link>
            <ThemePicker compact />
            <button
              onClick={async () => {
                await signOut();
                setMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs text-[var(--color-card-muted)] hover:text-[var(--color-card-text)] rounded-lg transition-colors"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </>
  );
}
