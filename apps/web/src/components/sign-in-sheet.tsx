"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { isFirebaseConfigured } from "@/lib/firebase";

interface SignInSheetProps {
  open: boolean;
  onClose: () => void;
}

export function SignInSheet({ open, onClose }: SignInSheetProps) {
  const { signInWithGoogle, loading } = useAuth();

  async function handleSignIn() {
    try {
      await signInWithGoogle();
      onClose();
    } catch {
      // User cancelled or Firebase not configured — stay open
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-6 pb-10"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="flex flex-col gap-5 max-w-sm mx-auto">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold text-[var(--color-card-text)]">
                  Sign in to place your bet
                </h2>
                <p className="text-sm text-[var(--color-card-muted)]">
                  Track your record, build calibration, and compete on the leaderboard.
                </p>
              </div>

              <button
                onClick={handleSignIn}
                disabled={loading || !isFirebaseConfigured}
                className="flex items-center justify-center gap-3 w-full rounded-xl border border-[var(--color-card-border)] bg-white text-gray-800 font-semibold text-sm py-3.5 hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {/* Google G logo */}
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden>
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {!isFirebaseConfigured ? "Sign-in not yet configured" : "Continue with Google"}
              </button>

              <p className="text-[10px] text-center text-[var(--color-card-muted)]">
                Practice mode only — no real funds at risk until Kalshi goes live.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
