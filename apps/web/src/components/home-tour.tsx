"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
import { getHasSeenHomeTour, setHasSeenHomeTour } from "@/lib/user-store";

const TOUR_KEY = "thecard:home-tour:v1";

const STEPS = [
  {
    kickerKey: "tour.step1.kicker",
    titleKey: "tour.step1.title",
    bodyKey: "tour.step1.body",
    audio: "/tour/home-tour-1.mp3",
    ctaKey: "tour.step1.cta",
  },
  {
    kickerKey: "tour.step2.kicker",
    titleKey: "tour.step2.title",
    bodyKey: "tour.step2.body",
    audio: "/tour/home-tour-2.mp3",
    ctaKey: "tour.step2.cta",
  },
  {
    kickerKey: "tour.step3.kicker",
    titleKey: "tour.step3.title",
    bodyKey: "tour.step3.body",
    audio: "/tour/home-tour-3.mp3",
    ctaKey: "tour.step3.cta",
  },
] as const;

function readLocalSeen() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(TOUR_KEY) === "seen";
}

function writeLocalSeen() {
  if (typeof window !== "undefined") localStorage.setItem(TOUR_KEY, "seen");
}

export function HomeTour() {
  const { user, loading, verificationRequired } = useAuth();
  const { t } = useI18n();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "playing" | "missing">("idle");

  const current = STEPS[step]!;
  const isLast = step === STEPS.length - 1;
  const gameChips = useMemo(() => ["Card", "Blitz", "Live", "H2H", "Forecast"], []);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;

    async function loadSeenState() {
      const localSeen = readLocalSeen();
      if (!user) {
        if (!cancelled) {
          setOpen(!localSeen);
          setReady(true);
        }
        return;
      }

      try {
        const remoteSeen = await getHasSeenHomeTour(user.uid);
        if (cancelled) return;
        const seen = remoteSeen || localSeen;
        setOpen(!seen);
        setReady(true);
        if (seen) writeLocalSeen();
        if (localSeen && !remoteSeen && !verificationRequired) void setHasSeenHomeTour(user.uid);
      } catch {
        if (!cancelled) {
          setOpen(!localSeen);
          setReady(true);
        }
      }
    }

    void loadSeenState();
    return () => {
      cancelled = true;
    };
  }, [loading, user, verificationRequired]);

  useEffect(() => {
    setVoiceStatus("idle");
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, [step, open]);

  async function dismiss() {
    writeLocalSeen();
    setOpen(false);
    if (audioRef.current) audioRef.current.pause();
    if (user && !verificationRequired) await setHasSeenHomeTour(user.uid).catch(() => undefined);
  }

  function replay() {
    setStep(0);
    setOpen(true);
  }

  async function playVoice() {
    if (voiceStatus === "playing") {
      audioRef.current?.pause();
      setVoiceStatus("idle");
      return;
    }

    const audio = new Audio(current.audio);
    audioRef.current = audio;
    audio.onended = () => setVoiceStatus("idle");
    audio.onerror = () => setVoiceStatus("missing");
    try {
      setVoiceStatus("playing");
      await audio.play();
    } catch {
      setVoiceStatus("missing");
    }
  }

  function nextStep() {
    setStep((value) => Math.min(value + 1, STEPS.length - 1));
  }

  return (
    <>
      {ready && !open && (
        <button
          type="button"
          onClick={replay}
          className="fixed bottom-24 left-4 z-40 rounded-full border border-[var(--color-card-border)] bg-[var(--color-card-surface)] px-4 py-2 text-xs font-black text-[var(--color-card-text)] shadow-xl transition-colors hover:border-[var(--color-brand-primary)]"
        >
          {t("tour.replay")}
        </button>
      )}

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="home-tour-title"
              className="fixed inset-x-4 top-1/2 z-[80] mx-auto max-w-xl -translate-y-1/2 overflow-hidden rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] shadow-2xl"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
            >
              <div className="grid gap-0 sm:grid-cols-[190px_1fr]">
                <div className="relative min-h-52 overflow-hidden bg-[var(--color-surface-2)] p-5">
                  <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 50% 20%, rgba(255,60,60,0.45), transparent 55%)" }} />
                  <div className="relative mx-auto mt-4 flex h-36 w-28 animate-[float_3s_ease-in-out_infinite] flex-col items-center justify-center rounded-2xl border-2 border-[var(--color-brand-primary)] bg-[var(--color-card-surface)] shadow-[0_0_30px_rgba(255,60,60,0.25)]">
                    <div className="absolute -top-3 h-6 w-14 rounded-full border border-[var(--color-brand-primary)] bg-[var(--color-surface-0)]" />
                    <div className="mb-3 grid grid-cols-2 gap-4">
                      <span className="h-3 w-3 rounded-full bg-[var(--color-brand-primary)]" />
                      <span className="h-3 w-3 rounded-full bg-[var(--color-brand-primary)]" />
                    </div>
                    <div className="h-2 w-12 rounded-full bg-[var(--color-card-border)]" />
                    <p className="mt-5 text-center text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("tour.scout")}</p>
                  </div>
                  <div className="relative mt-5 flex flex-wrap justify-center gap-1.5">
                    {gameChips.map((chip) => (
                      <span key={chip} className="rounded-full border border-[var(--color-card-border)] px-2 py-1 text-[10px] font-bold text-[var(--color-card-muted)]">
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="border-b border-[var(--color-card-border)] px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t(current.kickerKey)}</p>
                      <button type="button" onClick={dismiss} className="text-xs font-bold text-[var(--color-card-muted)] hover:text-[var(--color-card-text)]">
                        {t("tour.skip")}
                      </button>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {STEPS.map((item, index) => (
                        <span
                          key={item.titleKey}
                          className={`h-1.5 rounded-full ${index <= step ? "bg-[var(--color-brand-primary)]" : "bg-[var(--color-card-border)]"}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="px-5 py-6">
                    <h2 id="home-tour-title" className="text-3xl font-display font-black tracking-tight text-[var(--color-card-text)]">
                      {t(current.titleKey)}
                    </h2>
                    <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">{t(current.bodyKey)}</p>

                    <button
                      type="button"
                      onClick={() => void playVoice()}
                      className="mt-5 rounded-xl border border-[var(--color-card-border)] px-3 py-2 text-xs font-black text-[var(--color-card-text)] transition-colors hover:border-[var(--color-brand-primary)]"
                    >
                      {voiceStatus === "playing" ? t("tour.pauseVoice") : t("tour.playVoice")}
                    </button>
                    {voiceStatus === "missing" && (
                      <p className="mt-2 text-xs text-[var(--color-card-muted)]">{t("tour.voiceMissing")}</p>
                    )}

                    <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                      {isLast ? (
                        <Link
                          href="/card"
                          onClick={() => void dismiss()}
                          className="flex-1 rounded-xl bg-[var(--color-brand-primary)] px-4 py-3 text-center text-sm font-black text-white transition-colors hover:bg-red-500"
                        >
                          {t(current.ctaKey)}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={nextStep}
                          className="flex-1 rounded-xl bg-[var(--color-brand-primary)] px-4 py-3 text-sm font-black text-white transition-colors hover:bg-red-500"
                        >
                          {t(current.ctaKey)}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void dismiss()}
                        className="rounded-xl border border-[var(--color-card-border)] px-4 py-3 text-sm font-bold text-[var(--color-card-muted)] transition-colors hover:border-[var(--color-brand-primary)] hover:text-[var(--color-card-text)]"
                      >
                        {t("tour.dontShowAgain")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
