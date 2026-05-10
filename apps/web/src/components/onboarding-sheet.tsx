"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { EmailVerificationNotice } from "./email-verification-notice";
import { checkUsernameAvailable, setUsername as persistUsername, uploadAvatar } from "@/lib/user-store";
import { createTeam, joinTeamByCode } from "@/lib/team-store";

type Step = "username" | "photo" | "team" | "done";
type TeamMode = "choose" | "create" | "join";

const USERNAME_RE = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;

async function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), 20000);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function validateUsername(value: string): string | null {
  if (value.length < 3) return "At least 3 characters.";
  if (!USERNAME_RE.test(value)) return "Letters, numbers, underscores only. Must start with a letter.";
  return null;
}

export function OnboardingSheet() {
  const { user, needsOnboarding, verificationRequired, completeOnboarding } = useAuth();
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const teamPhotoInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("username");

  useEffect(() => {
    if (!needsOnboarding) return;
    setStep("username");
    setUsernameValue("");
    setUsernameError(null);
    setSavingUsername(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    setUploadingAvatar(false);
    setAvatarError(null);
    setTeamMode("choose");
    setTeamName("");
    setTeamPhotoFile(null);
    setTeamPhotoPreview(null);
    setInviteCode("");
    setTeamError(null);
    setTeamBusy(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsOnboarding]);

  const [username, setUsernameValue] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [savingUsername, setSavingUsername] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [teamMode, setTeamMode] = useState<TeamMode>("choose");
  const [teamName, setTeamName] = useState("");
  const [teamPhotoFile, setTeamPhotoFile] = useState<File | null>(null);
  const [teamPhotoPreview, setTeamPhotoPreview] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [teamError, setTeamError] = useState<string | null>(null);
  const [teamBusy, setTeamBusy] = useState(false);

  if (!user || !needsOnboarding) return null;

  if (verificationRequired) {
    return (
      <AnimatePresence>
        <motion.div
          key="verification-backdrop"
          className="fixed inset-0 z-40 bg-black/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
        <motion.div
          key="verification-required"
          className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-6 pb-32"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
        >
          <div className="mx-auto max-w-sm">
            <EmailVerificationNotice compact />
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const googlePhoto = user.photoURL;
  const displayedAvatar = avatarPreview ?? googlePhoto;
  const initial = (user.displayName?.[0] ?? user.email?.[0] ?? "?").toUpperCase();

  async function handleClaimUsername() {
    if (!user) return;
    const trimmed = username.trim().toLowerCase();
    const err = validateUsername(trimmed);
    if (err) { setUsernameError(err); return; }
    setSavingUsername(true);
    setUsernameError(null);
    try {
      const available = await checkUsernameAvailable(trimmed);
      if (!available) { setUsernameError("That username is taken. Try another."); return; }
      await persistUsername(user.uid, trimmed);
      setStep("photo");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong. Try again.";
      console.error("Username claim error:", msg);
      setUsernameError(msg);
    } finally {
      setSavingUsername(false);
    }
  }

  function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handlePhotoStep(skip: boolean) {
    if (!user) return;
    if (!skip && avatarFile) {
      setUploadingAvatar(true);
      setAvatarError(null);
      try {
        await withTimeout(uploadAvatar(user.uid, avatarFile), "Upload timed out. Try a smaller image or skip for now.");
      } catch (e) {
        setAvatarError(e instanceof Error ? e.message : "Could not upload photo. Try a smaller image or skip for now.");
        return;
      }
      finally { setUploadingAvatar(false); }
    }
    setStep("team");
  }

  function handleTeamPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setTeamPhotoFile(file);
    setTeamPhotoPreview(URL.createObjectURL(file));
  }

  async function handleCreateTeam() {
    if (!user) return;
    if (!teamName.trim()) { setTeamError("Team name is required."); return; }
    if (!teamPhotoFile) { setTeamError("A team photo is required."); return; }
    setTeamBusy(true);
    setTeamError(null);
    try {
      await createTeam(user.uid, teamName.trim(), teamPhotoFile);
      setStep("done");
    } catch {
      setTeamError("Could not create team. Try again.");
    } finally {
      setTeamBusy(false);
    }
  }

  async function handleJoinTeam() {
    if (!user || !inviteCode.trim()) return;
    setTeamBusy(true);
    setTeamError(null);
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
            key="onboarding-backdrop"
            className="fixed inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            key={step}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-6 pb-32"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >

            {step === "username" && (
              <div className="flex flex-col gap-5 max-w-sm mx-auto">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest">Welcome to The Card</p>
                  <h2 className="text-xl font-black text-[var(--color-card-text)]">Pick your username</h2>
                  <p className="text-sm text-[var(--color-card-muted)]">This is how you&apos;ll appear on the leaderboard.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="e.g. sharpscott"
                    value={username}
                    onChange={(e) => { setUsernameValue(e.target.value); setUsernameError(null); }}
                    onKeyDown={(e) => e.key === "Enter" && handleClaimUsername()}
                    maxLength={20}
                    autoFocus
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-1)] px-4 py-3 text-sm text-[var(--color-card-text)] placeholder:text-[var(--color-card-muted)] focus:outline-none focus:border-[var(--color-brand-primary)] transition-colors font-mono"
                  />
                  {usernameError && <p className="text-xs text-[var(--color-danger)]">{usernameError}</p>}
                  <p className="text-[10px] text-[var(--color-card-muted)]">
                    3-20 characters - letters, numbers, underscores - cannot be changed later
                  </p>
                </div>
                <button
                  onClick={handleClaimUsername}
                  disabled={savingUsername || username.trim().length < 3}
                  className="w-full rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-sm py-3.5 hover:bg-red-500 transition-all active:scale-[0.98] disabled:opacity-40"
                >
                  {savingUsername ? "Checking..." : "Claim Username ->"}
                </button>
              </div>
            )}

            {step === "photo" && (
              <div className="flex flex-col gap-5 max-w-sm mx-auto">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest">Step 2 of 3</p>
                  <h2 className="text-xl font-black text-[var(--color-card-text)]">Add a profile photo</h2>
                  <p className="text-sm text-[var(--color-card-muted)]">
                    {googlePhoto ? "We pulled your Google photo. Upload a different one or keep it." : "Put a face to your username on the leaderboard."}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-[var(--color-card-border)] hover:border-[var(--color-brand-primary)] transition-colors shrink-0 group"
                  >
                    {displayedAvatar ? (
                      <img src={displayedAvatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center bg-[var(--color-card-accent)] text-white text-2xl font-black">{initial}</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-bold">Change</span>
                    </div>
                  </button>
                  <div className="flex flex-col gap-1.5">
                    <button onClick={() => avatarInputRef.current?.click()} className="text-sm font-bold text-[var(--color-brand-primary)] hover:underline text-left">
                      Upload photo
                    </button>
                    <p className="text-xs text-[var(--color-card-muted)]">
                      {avatarFile ? avatarFile.name : googlePhoto ? "Using your Google photo" : "No photo set"}
                    </p>
                  </div>
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
                {avatarError && <p className="text-xs text-[var(--color-danger)]">{avatarError}</p>}
                <button
                  onClick={() => handlePhotoStep(false)}
                  disabled={uploadingAvatar}
                  className="w-full rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-sm py-3.5 hover:bg-red-500 transition-all active:scale-[0.98] disabled:opacity-40"
                >
                  {uploadingAvatar ? "Uploading..." : "Continue ->"}
                </button>
                <button onClick={() => handlePhotoStep(true)} disabled={uploadingAvatar} className="text-center text-xs text-[var(--color-card-muted)] hover:text-[var(--color-card-text)] transition-colors">
                  Skip for now
                </button>
              </div>
            )}

            {step === "team" && teamMode === "choose" && (
              <div className="flex flex-col gap-5 max-w-sm mx-auto">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest">Step 3 of 3</p>
                  <h2 className="text-xl font-black text-[var(--color-card-text)]">Join or create a team</h2>
                  <p className="text-sm text-[var(--color-card-muted)]">Compete as a group on a shared leaderboard.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => setTeamMode("create")} className="w-full rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-1)] px-4 py-3.5 text-sm font-bold text-[var(--color-card-text)] hover:border-[var(--color-brand-primary)] transition-colors text-left">
                    Create a team
                  </button>
                  <button onClick={() => setTeamMode("join")} className="w-full rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-1)] px-4 py-3.5 text-sm font-bold text-[var(--color-card-text)] hover:border-[var(--color-brand-primary)] transition-colors text-left">
                    Join with invite code
                  </button>
                </div>
                <button onClick={() => setStep("done")} className="text-center text-xs text-[var(--color-card-muted)] hover:text-[var(--color-card-text)] transition-colors">
                  Skip - play solo
                </button>
              </div>
            )}

            {step === "team" && teamMode === "create" && (
              <div className="flex flex-col gap-5 max-w-sm mx-auto">
                <div className="flex flex-col gap-1">
                  <button onClick={() => { setTeamMode("choose"); setTeamError(null); }} className="text-xs text-[var(--color-card-muted)] hover:text-[var(--color-card-text)] transition-colors self-start mb-1">Back</button>
                  <h2 className="text-xl font-black text-[var(--color-card-text)]">Create a team</h2>
                  <p className="text-sm text-[var(--color-card-muted)]">A team photo is required - it shows on the leaderboard.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder="Team name"
                    value={teamName}
                    onChange={(e) => { setTeamName(e.target.value); setTeamError(null); }}
                    maxLength={40}
                    className="w-full rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-1)] px-4 py-3 text-sm text-[var(--color-card-text)] placeholder:text-[var(--color-card-muted)] focus:outline-none focus:border-[var(--color-brand-primary)] transition-colors"
                  />
                  <button
                    onClick={() => teamPhotoInputRef.current?.click()}
                    className="flex items-center gap-3 w-full rounded-xl border border-dashed border-[var(--color-card-border)] hover:border-[var(--color-brand-primary)] bg-[var(--color-surface-1)] px-4 py-3 transition-colors"
                  >
                    {teamPhotoPreview ? (
                      <img src={teamPhotoPreview} alt="Team" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[var(--color-card-accent)]/20 flex items-center justify-center shrink-0">
                        <span className="text-lg">Photo</span>
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-sm font-bold text-[var(--color-card-text)]">{teamPhotoFile ? teamPhotoFile.name : "Upload team photo"}</p>
                      <p className="text-[10px] text-[var(--color-brand-primary)] font-semibold">Required</p>
                    </div>
                  </button>
                  <input ref={teamPhotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleTeamPhotoChange} />
                  {teamError && <p className="text-xs text-[var(--color-danger)]">{teamError}</p>}
                </div>
                <button
                  onClick={handleCreateTeam}
                  disabled={teamBusy || !teamName.trim() || !teamPhotoFile}
                  className="w-full rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-sm py-3.5 hover:bg-red-500 transition-all active:scale-[0.98] disabled:opacity-40"
                >
                  {teamBusy ? "Creating..." : "Create Team ->"}
                </button>
              </div>
            )}

            {step === "team" && teamMode === "join" && (
              <div className="flex flex-col gap-5 max-w-sm mx-auto">
                <div className="flex flex-col gap-1">
                  <button onClick={() => { setTeamMode("choose"); setTeamError(null); }} className="text-xs text-[var(--color-card-muted)] hover:text-[var(--color-card-text)] transition-colors self-start mb-1">Back</button>
                  <h2 className="text-xl font-black text-[var(--color-card-text)]">Join a team</h2>
                  <p className="text-sm text-[var(--color-card-muted)]">Enter the invite code your team captain shared.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="e.g. ABC123"
                    value={inviteCode}
                    onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setTeamError(null); }}
                    maxLength={6}
                    className="w-full rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-1)] px-4 py-3 text-sm text-[var(--color-card-text)] placeholder:text-[var(--color-card-muted)] focus:outline-none focus:border-[var(--color-brand-primary)] transition-colors font-mono tracking-widest"
                  />
                  {teamError && <p className="text-xs text-[var(--color-danger)]">{teamError}</p>}
                </div>
                <button
                  onClick={handleJoinTeam}
                  disabled={teamBusy || inviteCode.trim().length < 4}
                  className="w-full rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-sm py-3.5 hover:bg-red-500 transition-all active:scale-[0.98] disabled:opacity-40"
                >
                  {teamBusy ? "Joining..." : "Join Team ->"}
                </button>
              </div>
            )}

            {step === "done" && (
              <div className="flex flex-col gap-5 max-w-sm mx-auto">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest">You are in</p>
                  <h2 className="text-xl font-black text-[var(--color-card-text)]">@{username.trim().toLowerCase()} - ready.</h2>
                  <p className="text-sm text-[var(--color-card-muted)]">Make your first prediction to unlock your calibration score and appear on the leaderboard.</p>
                </div>
                <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-1)] p-4 flex flex-col gap-2">
                  <p className="text-xs font-bold text-[var(--color-card-text)]">How calibration scoring works</p>
                  <ul className="text-xs text-[var(--color-card-muted)] space-y-1.5">
                    <li>Set a probability, not just YES or NO</li>
                    <li>Markets resolve when the event settles</li>
                    <li>Your Brier score measures accuracy at stated confidence</li>
                    <li>5 resolved predictions unlocks your leaderboard rank</li>
                  </ul>
                </div>
                <button onClick={handleStartPredicting} className="w-full rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-sm py-3.5 hover:bg-red-500 transition-all active:scale-[0.98]">
                  Make My First Prediction
                </button>
              </div>
            )}

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
