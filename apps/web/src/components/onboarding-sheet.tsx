"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { checkUsernameAvailable, setUsername as persistUsername } from "@/lib/user-store";

type Step = "username" | "nudge";

const USERNAME_RE = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;

function validate(value: string): string | null {
  if (value.length < 3) return "At least 3 characters.";
  if (!USERNAME_RE.test(value)) return "Letters, numbers, underscores only. Must start with a letter.";
  return null;
}

export function OnboardingSheet() {
  const { user, needsOnboarding, completeOnboarding } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>("username");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!user || !needsOnboarding) return null;

  async function handleClaim() {
    if (!user) return;
    const trimmed = username.trim().toLowerCase();
    const validationError = validate(trimmed);
    if (validationError) { setError(validationError); return; }

    setSaving(true);
    setError(null);
    try {
      const available = await checkUsernameAvailable(trimmed);
      if (!available) { setError("That username is taken. Try another."); return; }
      await persistUsername(user.uid, trimmed);
      setStep("nudge");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleStartPredicting() {
    completeOnboarding();
    router.push("/forecast");
  }

  return (
    <AnimatePresence>
      {needsOnboarding && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-6 pb-12"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {step === "username" ? (
              <div className="flex flex-col gap-5 max-w-sm mx-auto">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest">
                    Welcome to Forecast
                  </p>
                  <h2 className="text-xl font-black text-[var(--color-card-text)]">
                    Pick your username
                  </h2>
                  <p className="text-sm text-[var(--color-card-muted)]">
                    This is how you&apos;ll appear on the leaderboard.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="e.g. sharpscott"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(null); }}
                    onKeyDown={(e) => e.key === "Enter" && handleClaim()}
                    maxLength={20}
                    autoFocus
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-1)] px-4 py-3 text-sm text-[var(--color-card-text)] placeholder:text-[var(--color-card-muted)] focus:outline-none focus:border-[var(--color-brand-primary)] transition-colors font-mono"
                  />
                  {error && (
                    <p className="text-xs text-[var(--color-danger)]">{error}</p>
                  )}
                  <p className="text-[10px] text-[var(--color-card-muted)]">
                    3–20 characters · letters, numbers, underscores · can&apos;t be changed later
                  </p>
                </div>

                <button
                  onClick={handleClaim}
                  disabled={saving || username.trim().length < 3}
                  className="w-full rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-sm py-3.5 hover:bg-red-500 transition-all active:scale-[0.98] disabled:opacity-40"
                >
                  {saving ? "Checking…" : "Claim Username →"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-5 max-w-sm mx-auto">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest">
                    You&apos;re in
                  </p>
                  <h2 className="text-xl font-black text-[var(--color-card-text)]">
                    @{username.trim().toLowerCase()} — claimed.
                  </h2>
                  <p className="text-sm text-[var(--color-card-muted)]">
                    Make your first prediction to unlock your calibration score and get on the leaderboard.
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-1)] p-4 flex flex-col gap-2">
                  <p className="text-xs font-bold text-[var(--color-card-text)]">How calibration scoring works</p>
                  <ul className="text-xs text-[var(--color-card-muted)] space-y-1.5">
                    <li>• Set a probability, not just YES or NO</li>
                    <li>• Markets resolve when the event settles</li>
                    <li>• Your Brier score measures accuracy at stated confidence</li>
                    <li>• 5 resolved predictions unlocks your leaderboard rank</li>
                  </ul>
                </div>

                <button
                  onClick={handleStartPredicting}
                  className="w-full rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-sm py-3.5 hover:bg-red-500 transition-all active:scale-[0.98]"
                >
                  Make My First Prediction →
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
