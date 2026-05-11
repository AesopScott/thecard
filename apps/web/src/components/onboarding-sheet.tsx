"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
import { EmailVerificationNotice } from "./email-verification-notice";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { checkUsernameAvailable, setUserCountry, setUsername as persistUsername, uploadAvatar } from "@/lib/user-store";
import { createTeam, joinTeamByCode, type Team } from "@/lib/team-store";

type Step = "username" | "country" | "photo" | "team" | "done";
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

function validateUsername(value: string, t: ReturnType<typeof useI18n>["t"]): string | null {
  if (value.length < 3) return t("onboarding.username.min");
  if (!USERNAME_RE.test(value)) return t("onboarding.username.invalid");
  return null;
}

export function OnboardingSheet() {
  const { user, needsOnboarding, username: existingUsername, countryCode: existingCountryCode, verificationRequired, refreshUser, completeOnboarding } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const teamPhotoInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("username");

  const [username, setUsernameValue] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [savingUsername, setSavingUsername] = useState(false);
  const [countryCode, setCountryCode] = useState("US");
  const [savingCountry, setSavingCountry] = useState(false);
  const [countryError, setCountryError] = useState<string | null>(null);

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
  const [joinedTeam, setJoinedTeam] = useState<Team | null>(null);

  useEffect(() => {
    if (!needsOnboarding) return;
    setStep(existingUsername ? "country" : "username");
    setUsernameValue("");
    setUsernameError(null);
    setSavingUsername(false);
    setCountryCode(existingCountryCode ?? "US");
    setSavingCountry(false);
    setCountryError(null);
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
    setJoinedTeam(null);
  }, [existingCountryCode, existingUsername, needsOnboarding]);

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
  const finalUsername = username.trim().toLowerCase() || existingUsername || "you";

  async function handleClaimUsername() {
    if (!user) return;
    const trimmed = username.trim().toLowerCase();
    const err = validateUsername(trimmed, t);
    if (err) { setUsernameError(err); return; }
    setSavingUsername(true);
    setUsernameError(null);
    try {
      const available = await checkUsernameAvailable(trimmed);
      if (!available) { setUsernameError(t("onboarding.username.taken")); return; }
      await persistUsername(user.uid, trimmed);
      await refreshUser();
      setStep("country");
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("onboarding.genericError");
      console.error("Username claim error:", msg);
      setUsernameError(msg);
    } finally {
      setSavingUsername(false);
    }
  }

  async function handleCountryStep() {
    if (!user) return;
    const country = COUNTRY_OPTIONS.find((option) => option.code === countryCode);
    if (!country) {
      setCountryError(t("onboarding.country.chooseError"));
      return;
    }
    setSavingCountry(true);
    setCountryError(null);
    try {
      await setUserCountry(user.uid, country);
      await refreshUser();
      if (existingUsername) {
        completeOnboarding();
        return;
      }
      setStep("photo");
    } catch {
      setCountryError(t("onboarding.country.saveError"));
    } finally {
      setSavingCountry(false);
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
        await withTimeout(uploadAvatar(user.uid, avatarFile), t("onboarding.photo.timeout"));
      } catch (e) {
        setAvatarError(e instanceof Error ? e.message : t("onboarding.photo.error"));
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
    if (!teamName.trim()) { setTeamError(t("onboarding.team.nameRequired")); return; }
    if (!teamPhotoFile) { setTeamError(t("onboarding.team.photoRequired")); return; }
    setTeamBusy(true);
    setTeamError(null);
    try {
      const team = await createTeam(user.uid, teamName.trim(), teamPhotoFile);
      setJoinedTeam(team);
      await refreshUser();
      setStep("done");
    } catch {
      setTeamError(t("onboarding.team.createError"));
    } finally {
      setTeamBusy(false);
    }
  }

  async function handleJoinTeam() {
    if (!user || !inviteCode.trim()) return;
    setTeamBusy(true);
    setTeamError(null);
    try {
      const team = await joinTeamByCode(user.uid, inviteCode.trim());
      setJoinedTeam(team);
      await refreshUser();
      setStep("done");
    } catch (e) {
      setTeamError(e instanceof Error ? e.message : t("onboarding.team.invalidCode"));
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
                  <p className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest">{t("onboarding.welcome")}</p>
                  <h2 className="text-xl font-black text-[var(--color-card-text)]">{t("onboarding.pickUsername")}</h2>
                  <p className="text-sm text-[var(--color-card-muted)]">{t("onboarding.usernameHelp")}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder={t("onboarding.usernamePlaceholder")}
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
                    {t("onboarding.usernameRules")}
                  </p>
                </div>
                <button
                  onClick={handleClaimUsername}
                  disabled={savingUsername || username.trim().length < 3}
                  className="w-full rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-sm py-3.5 hover:bg-red-500 transition-all active:scale-[0.98] disabled:opacity-40"
                >
                  {savingUsername ? t("onboarding.checking") : t("onboarding.claimUsername")}
                </button>
              </div>
            )}

            {step === "country" && (
              <div className="flex flex-col gap-5 max-w-sm mx-auto">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest">{t("onboarding.step2")}</p>
                  <h2 className="text-xl font-black text-[var(--color-card-text)]">{t("onboarding.chooseCountry")}</h2>
                  <p className="text-sm text-[var(--color-card-muted)]">{t("onboarding.countryHelp")}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <select
                    value={countryCode}
                    onChange={(event) => { setCountryCode(event.target.value); setCountryError(null); }}
                    className="w-full rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-1)] px-4 py-3 text-sm font-bold text-[var(--color-card-text)] focus:outline-none focus:border-[var(--color-brand-primary)]"
                  >
                    {COUNTRY_OPTIONS.map((country) => (
                      <option key={country.code} value={country.code}>{country.name}</option>
                    ))}
                  </select>
                  {countryError && <p className="text-xs text-[var(--color-danger)]">{countryError}</p>}
                  <p className="text-[10px] text-[var(--color-card-muted)]">
                    {t("onboarding.countryNote")}
                  </p>
                </div>
                <button
                  onClick={handleCountryStep}
                  disabled={savingCountry}
                  className="w-full rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-sm py-3.5 hover:bg-red-500 transition-all active:scale-[0.98] disabled:opacity-40"
                >
                  {savingCountry ? t("onboarding.saving") : t("onboarding.continue")}
                </button>
              </div>
            )}

            {step === "photo" && (
              <div className="flex flex-col gap-5 max-w-sm mx-auto">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest">{t("onboarding.step3")}</p>
                  <h2 className="text-xl font-black text-[var(--color-card-text)]">{t("onboarding.addPhoto")}</h2>
                  <p className="text-sm text-[var(--color-card-muted)]">
                    {googlePhoto ? t("onboarding.googlePhoto") : t("onboarding.photoHelp")}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-[var(--color-card-border)] hover:border-[var(--color-brand-primary)] transition-colors shrink-0 group"
                  >
                    {displayedAvatar ? (
                      <Image src={displayedAvatar} alt="Avatar" width={80} height={80} className="w-full h-full object-cover" unoptimized />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center bg-[var(--color-card-accent)] text-white text-2xl font-black">{initial}</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{t("onboarding.change")}</span>
                    </div>
                  </button>
                  <div className="flex flex-col gap-1.5">
                    <button onClick={() => avatarInputRef.current?.click()} className="text-sm font-bold text-[var(--color-brand-primary)] hover:underline text-left">
                      {t("onboarding.uploadPhoto")}
                    </button>
                    <p className="text-xs text-[var(--color-card-muted)]">
                      {avatarFile ? avatarFile.name : googlePhoto ? t("onboarding.usingGooglePhoto") : t("onboarding.noPhoto")}
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
                  {uploadingAvatar ? t("onboarding.uploading") : t("onboarding.continue")}
                </button>
                <button onClick={() => handlePhotoStep(true)} disabled={uploadingAvatar} className="text-center text-xs text-[var(--color-card-muted)] hover:text-[var(--color-card-text)] transition-colors">
                  {t("onboarding.skipNow")}
                </button>
              </div>
            )}

            {step === "team" && teamMode === "choose" && (
              <div className="flex flex-col gap-5 max-w-sm mx-auto">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest">{t("onboarding.step4")}</p>
                  <h2 className="text-xl font-black text-[var(--color-card-text)]">{t("onboarding.joinCreateTeam")}</h2>
                  <p className="text-sm text-[var(--color-card-muted)]">{t("onboarding.teamHelp")}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => setTeamMode("create")} className="w-full rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-1)] px-4 py-3.5 text-sm font-bold text-[var(--color-card-text)] hover:border-[var(--color-brand-primary)] transition-colors text-left">
                    {t("onboarding.createTeam")}
                  </button>
                  <button onClick={() => setTeamMode("join")} className="w-full rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-1)] px-4 py-3.5 text-sm font-bold text-[var(--color-card-text)] hover:border-[var(--color-brand-primary)] transition-colors text-left">
                    {t("onboarding.joinInvite")}
                  </button>
                </div>
                <button onClick={() => setStep("done")} className="text-center text-xs text-[var(--color-card-muted)] hover:text-[var(--color-card-text)] transition-colors">
                  {t("onboarding.skipSolo")}
                </button>
              </div>
            )}

            {step === "team" && teamMode === "create" && (
              <div className="flex flex-col gap-5 max-w-sm mx-auto">
                <div className="flex flex-col gap-1">
                  <button onClick={() => { setTeamMode("choose"); setTeamError(null); }} className="text-xs text-[var(--color-card-muted)] hover:text-[var(--color-card-text)] transition-colors self-start mb-1">{t("onboarding.back")}</button>
                  <h2 className="text-xl font-black text-[var(--color-card-text)]">{t("onboarding.createTeam")}</h2>
                  <p className="text-sm text-[var(--color-card-muted)]">{t("onboarding.teamPhotoHelp")}</p>
                </div>
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder={t("onboarding.teamName")}
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
                      <Image src={teamPhotoPreview} alt="Team" width={40} height={40} className="w-10 h-10 rounded-lg object-cover shrink-0" unoptimized />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[var(--color-card-accent)]/20 flex items-center justify-center shrink-0">
                        <span className="text-lg">{t("onboarding.photo")}</span>
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-sm font-bold text-[var(--color-card-text)]">{teamPhotoFile ? teamPhotoFile.name : t("onboarding.uploadTeamPhoto")}</p>
                      <p className="text-[10px] text-[var(--color-brand-primary)] font-semibold">{t("onboarding.required")}</p>
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
                  {teamBusy ? t("onboarding.creating") : t("onboarding.createTeamButton")}
                </button>
              </div>
            )}

            {step === "team" && teamMode === "join" && (
              <div className="flex flex-col gap-5 max-w-sm mx-auto">
                <div className="flex flex-col gap-1">
                  <button onClick={() => { setTeamMode("choose"); setTeamError(null); }} className="text-xs text-[var(--color-card-muted)] hover:text-[var(--color-card-text)] transition-colors self-start mb-1">{t("onboarding.back")}</button>
                  <h2 className="text-xl font-black text-[var(--color-card-text)]">{t("onboarding.joinTeam")}</h2>
                  <p className="text-sm text-[var(--color-card-muted)]">{t("onboarding.joinHelp")}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder={t("onboarding.invitePlaceholder")}
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
                  {teamBusy ? t("onboarding.joining") : t("onboarding.joinTeamButton")}
                </button>
              </div>
            )}

            {step === "done" && (
              <div className="flex flex-col gap-5 max-w-sm mx-auto">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest">{t("onboarding.youAreIn")}</p>
                  <h2 className="text-xl font-black text-[var(--color-card-text)]">@{finalUsername} - {t("onboarding.ready")}</h2>
                  <p className="text-sm text-[var(--color-card-muted)]">
                    {joinedTeam ? t("onboarding.doneWithTeam").replace("{team}", joinedTeam.name) : t("onboarding.doneSolo")}
                  </p>
                </div>
                {joinedTeam?.inviteCode && (
                  <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-1)] p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("onboarding.teamInvite")}</p>
                      <p className="mt-1 text-xs text-[var(--color-card-muted)]">{t("onboarding.shareCode")}</p>
                    </div>
                    <span className="rounded-lg border border-[var(--color-card-border)] px-3 py-2 font-mono text-sm font-black text-[var(--color-card-text)]">
                      {joinedTeam.inviteCode}
                    </span>
                  </div>
                )}
                <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-1)] p-4 flex flex-col gap-2">
                  <p className="text-xs font-bold text-[var(--color-card-text)]">{t("onboarding.calibrationTitle")}</p>
                  <ul className="text-xs text-[var(--color-card-muted)] space-y-1.5">
                    <li>{t("onboarding.calibration1")}</li>
                    <li>{t("onboarding.calibration2")}</li>
                    <li>{t("onboarding.calibration3")}</li>
                    <li>{t("onboarding.calibration4")}</li>
                  </ul>
                </div>
                <button onClick={handleStartPredicting} className="w-full rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-sm py-3.5 hover:bg-red-500 transition-all active:scale-[0.98]">
                  {t("onboarding.firstPrediction")}
                </button>
              </div>
            )}

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
