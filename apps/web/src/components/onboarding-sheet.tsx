"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { checkUsernameAvailable, setUsername as persistUsername } from "@/lib/user-store";
import { createTeam, joinTeamByCode } from "@/lib/team-store";

type Step = "username" | "team" | "done";
type TeamMode = "choose" | "create" | "join";

const USERNAME_RE = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;

function validateHandle(value: string): string | null {
  if (value.length < 3) return "At least 3 characters.";
  if (!USERNAME_RE.test(value)) return "Letters, numbers, underscores only. Must start with a letter.";
  return null;
}

const STEPS: Step[] = ["username", "team", "done"];

export function OnboardingSheet() {
  const { user, needsOnboarding, completeOnboarding } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("username");

  // Username
  const [username, setUsername] = useState("");
  const [handleError, setHandleError] = useState<string | null>(null);
  const [handleBusy, setHandleBusy] = useState(false);

  // Team
  const [teamMode, setTeamMode] = useState<TeamMode>("choose");
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [teamError, setTeamError] = useState("");
  const [teamBusy, setTeamBusy] = useState(false);
  const [createdCode, setCreatedCode] = useState("");

  if (!user || !needsOnboarding) return null;

  async function handleClaim() {
    if (!user) return;
    const trimmed = username.trim().toLowerCase();
    const err = validateHandle(trimmed);
    if (err) { setHandleError(err); return; }
    setHandleBusy(true);
    setHandleError(null);
    try {
      const available = await checkUsernameAvailable(trimmed);
      if (!available) { setHandleError("That username is taken. Try another."); return; }
      await persistUsername(user.uid, trimmed);
      setStep("team");
    } catch {
      setHandleError("Something went wrong. Try again.");
    } finally {
      setHandleBusy(false);
    }
  }

  async function handleCreateTeam() {
    if (!user || !teamName.trim()) return;
    setTeamBusy(true);
    setTeamError("");
    try {
      const team = await createTeam(user.uid, teamName.trim());
      setCreatedCode(team.inviteCode);
      setStep("done");
    } catch {
      setTeamError("Couldn't create team. Try again.");
    } finally {
      setTeamBusy(false);
    }
  }

  async function handleJoinTeam() {
    if (!user || !inviteCode.trim()) return;
    setTeamBusy(true);
    setTeamError("");
    try {
      await joinTeamByCode(user.uid, inviteCode.trim());
      setStep("done");
    } catch (e) {
      setTeamError(e instanceof Error ? e.message : "Invalid code.");
    } finally {
      setTeamBusy(false);
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-6 pb-12 max-h-[90dvh] overflow-y-auto"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="flex flex-col gap-5 max-w-sm mx-auto">

              {/* Progress bar */}
              <div className="flex gap-1.5">
                {STEPS.map((s, i) => (
                  <div
                    key={s}
                    className="h-1 flex-1 rounded-full transition-colors"
                    style={{
                      backgroundColor: STEPS.indexOf(step) >= i
                        ? "var(--color-brand-primary)"
                        : "var(--color-card-border)",
                    }}
                  />
                ))}
              </div>

              {/* ── Step 1: Username ── */}
              {step === "username" && (
                <>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest">Welcome to Forecast</p>
                    <h2 className="text-xl font-black text-[var(--color-card-text)]">Pick your username</h2>
                    <p className="text-sm text-[var(--color-card-muted)]">This is how you&apos;ll appear on the leaderboard.</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="e.g. sharpscott"
                      value={username}
                      onChange={(e) => { setUsername(e.target.value); setHandleError(null); }}
                      onKeyDown={(e) => e.key === "Enter" && handleClaim()}
                      maxLength={20}
                      autoFocus
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      className="w-full rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-1)] px-4 py-3 text-sm text-[var(--color-card-text)] placeholder:text-[var(--color-card-muted)] focus:outline-none focus:border-[var(--color-brand-primary)] transition-colors font-mono"
                    />
                    {handleError && <p className="text-xs text-[var(--color-danger)]">{handleError}</p>}
                    <p className="text-[10px] text-[var(--color-card-muted)]">
                      3–20 characters · letters, numbers, underscores · can&apos;t be changed later
                    </p>
                  </div>
                  <button
                    onClick={handleClaim}
                    disabled={handleBusy || username.trim().length < 3}
                    className="w-full rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-sm py-3.5 hover:bg-red-500 transition-all active:scale-[0.98] disabled:opacity-40"
                  >
                    {handleBusy ? "Checking…" : "Claim Username →"}
                  </button>
                </>
              )}

              {/* ── Step 2: Team ── */}
              {step === "team" && (
                <>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-black text-[var(--color-card-text)]">Join a team</h2>
                    <p className="text-sm text-[var(--color-card-muted)]">Compete with friends on a shared leaderboard.</p>
                  </div>

                  {teamMode === "choose" && (
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => setTeamMode("create")}
                        className="w-full rounded-xl border-2 border-[var(--color-card-border)] bg-[var(--color-surface-1)] px-4 py-4 text-left hover:border-[var(--color-brand-primary)]/50 transition-colors"
                      >
                        <p className="text-sm font-bold text-[var(--color-card-text)]">Create a team</p>
                        <p className="text-xs text-[var(--color-card-muted)] mt-0.5">Start a team and share the invite code with your crew.</p>
                      </button>
                      <button
                        onClick={() => setTeamMode("join")}
                        className="w-full rounded-xl border-2 border-[var(--color-card-border)] bg-[var(--color-surface-1)] px-4 py-4 text-left hover:border-[var(--color-brand-primary)]/50 transition-colors"
                      >
                        <p className="text-sm font-bold text-[var(--color-card-text)]">Join with a code</p>
                        <p className="text-xs text-[var(--color-card-muted)] mt-0.5">Enter an invite code from a teammate.</p>
                      </button>
                      <button
                        onClick={() => setStep("done")}
                        className="text-xs text-[var(--color-card-muted)] hover:text-[var(--color-card-text)] transition-colors py-1"
                      >
                        Skip for now
                      </button>
                    </div>
                  )}

                  {teamMode === "create" && (
                    <div className="flex flex-col gap-3">
                      <input
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="Team name"
                        maxLength={40}
                        autoFocus
                        className="w-full rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-1)] px-4 py-3 text-sm text-[var(--color-card-text)] placeholder:text-[var(--color-card-muted)] focus:outline-none focus:border-[var(--color-brand-primary)] transition-colors"
                      />
                      {teamError && <p className="text-xs text-[var(--color-danger)]">{teamError}</p>}
                      <button
                        onClick={handleCreateTeam}
                        disabled={teamBusy || !teamName.trim()}
                        className="w-full rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-sm py-3.5 hover:bg-red-500 transition-all active:scale-[0.98] disabled:opacity-40"
                      >
                        {teamBusy ? "Creating…" : "Create Team"}
                      </button>
                      <button onClick={() => setTeamMode("choose")} className="text-xs text-[var(--color-card-muted)] hover:text-[var(--color-card-text)] transition-colors">← Back</button>
                    </div>
                  )}

                  {teamMode === "join" && (
                    <div className="flex flex-col gap-3">
                      <input
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                        placeholder="INVITE CODE"
                        maxLength={6}
                        autoFocus
                        className="w-full rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-1)] px-4 py-3 text-sm font-mono tracking-widest text-[var(--color-card-text)] placeholder:text-[var(--color-card-muted)] focus:outline-none focus:border-[var(--color-brand-primary)] transition-colors"
                      />
                      {teamError && <p className="text-xs text-[var(--color-danger)]">{teamError}</p>}
                      <button
                        onClick={handleJoinTeam}
                        disabled={teamBusy || inviteCode.length < 6}
                        className="w-full rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-sm py-3.5 hover:bg-red-500 transition-all active:scale-[0.98] disabled:opacity-40"
                      >
                        {teamBusy ? "Joining…" : "Join Team"}
                      </button>
                      <button onClick={() => setTeamMode("choose")} className="text-xs text-[var(--color-card-muted)] hover:text-[var(--color-card-text)] transition-colors">← Back</button>
                    </div>
                  )}
                </>
              )}

              {/* ── Step 3: Done ── */}
              {step === "done" && (
                <>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest">You&apos;re in</p>
                    <h2 className="text-xl font-black text-[var(--color-card-text)]">@{username.trim().toLowerCase()} — claimed.</h2>
                    <p className="text-sm text-[var(--color-card-muted)]">
                      Make your first prediction to unlock your calibration score and get on the leaderboard.
                    </p>
                  </div>

                  {createdCode && (
                    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-1)] p-4 flex flex-col gap-1.5">
                      <p className="text-xs font-bold text-[var(--color-card-muted)] uppercase tracking-widest">Team invite code</p>
                      <p className="text-2xl font-mono font-black tracking-widest text-[var(--color-brand-primary)]">{createdCode}</p>
                      <p className="text-xs text-[var(--color-card-muted)]">Share this with teammates so they can join your team.</p>
                    </div>
                  )}

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
                  <button
                    onClick={completeOnboarding}
                    className="text-xs text-[var(--color-card-muted)] hover:text-[var(--color-card-text)] transition-colors"
                  >
                    Explore the app first
                  </button>
                </>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
