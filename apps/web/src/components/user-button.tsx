"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { SignInSheet } from "./sign-in-sheet";

export function UserButton() {
  const { user, loading, signOut } = useAuth();
  const [signInOpen, setSignInOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  if (loading || pathname === "/") return null;

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

  const initial = user.displayName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "?";

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
          <div className="fixed top-14 right-4 z-40 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] shadow-lg p-1 min-w-[160px]">
            <div className="px-3 py-2 border-b border-[var(--color-card-border)] mb-1">
              <p className="text-xs font-semibold text-[var(--color-card-text)] truncate">
                {user.displayName ?? user.email}
              </p>
              <p className="text-[10px] text-[var(--color-card-muted)]">Forecaster</p>
            </div>
            <Link
              href={`/profile/${(user.displayName ?? user.email ?? "me").toLowerCase()}`}
              onClick={() => setMenuOpen(false)}
              className="block w-full text-left px-3 py-2 text-xs text-[var(--color-card-muted)] hover:text-[var(--color-card-text)] rounded-lg transition-colors"
            >
              View Profile
            </Link>
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
