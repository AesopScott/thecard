"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { isFirebaseConfigured } from "@/lib/firebase";

interface SignInSheetProps {
  open: boolean;
  onClose: () => void;
}

type AuthMode = "signin" | "signup";

export function SignInSheet({ open, onClose }: SignInSheetProps) {
  const { signInWithGoogle, signUpWithEmail, signInWithEmail, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleGoogleSignIn() {
    try {
      setError("");
      await signInWithGoogle();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Email and password required");
      return;
    }

    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password);
        setSuccess("Verification email sent! Check your inbox.");
        setEmail("");
        setPassword("");
        setTimeout(() => {
          setSuccess("");
          onClose();
        }, 3000);
      } else {
        await signInWithEmail(email, password);
        onClose();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      if (msg.includes("email-already-in-use")) {
        setError("Email already registered. Try signing in instead.");
      } else if (msg.includes("wrong-password")) {
        setError("Incorrect password.");
      } else if (msg.includes("user-not-found")) {
        setError("Email not found. Try signing up instead.");
      } else if (msg.includes("weak-password")) {
        setError("Password too weak. Use at least 6 characters.");
      } else {
        setError(msg);
      }
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
                  {mode === "signin" ? "Sign in" : "Create account"}
                </h2>
                <p className="text-sm text-[var(--color-card-muted)]">
                  Build your calibration record and compete for the Season 1 prize pool.
                </p>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading || !isFirebaseConfigured}
                className="flex items-center justify-center gap-3 w-full rounded-xl border border-[var(--color-card-border)] bg-white text-gray-800 font-semibold text-sm py-3.5 hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--color-card-border)]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 text-[var(--color-card-muted)] bg-[var(--color-card-surface)]">or</span>
                </div>
              </div>

              <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-surface)] px-3 py-2.5 text-sm text-[var(--color-card-text)] placeholder-[var(--color-card-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-surface)] px-3 py-2.5 text-sm text-[var(--color-card-text)] placeholder-[var(--color-card-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                />

                {error && (
                  <p className="text-xs text-red-500">{error}</p>
                )}
                {success && (
                  <p className="text-xs text-green-500">{success}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-[var(--color-brand-primary)] text-white font-semibold text-sm py-3 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? "Loading..." : mode === "signin" ? "Sign in" : "Create account"}
                </button>
              </form>

              <button
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setError("");
                  setEmail("");
                  setPassword("");
                }}
                className="text-xs text-center text-[var(--color-card-muted)] hover:text-[var(--color-brand-primary)] transition-colors"
              >
                {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>

              <p className="text-[10px] text-center text-[var(--color-card-muted)]">
                Free to play — no real money. Seasonal prizes funded by The Card.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
