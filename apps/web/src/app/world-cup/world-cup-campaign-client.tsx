"use client";

import Image from "next/image";
import Link from "next/link";

import { useI18n } from "@/contexts/i18n-context";
import type { TranslationKey } from "@/lib/i18n";

const CAMPAIGN_STATS: { label: TranslationKey; value: string }[] = [
  { label: "worldCup.statWindow", value: "Jun 11 - Jul 19" },
  { label: "worldCup.statMatches", value: "104" },
  { label: "worldCup.statCost", value: "$0" },
  { label: "worldCup.statModes", value: "4" },
];

const CAMPAIGN_STEPS: TranslationKey[] = [
  "worldCup.stepOne",
  "worldCup.stepTwo",
  "worldCup.stepThree",
];

const LIVE_BETS: { title: TranslationKey; detail: TranslationKey }[] = [
  { title: "worldCup.betMomentumTitle", detail: "worldCup.betMomentumDetail" },
  { title: "worldCup.betCardTitle", detail: "worldCup.betCardDetail" },
  { title: "worldCup.betPerfectTitle", detail: "worldCup.betPerfectDetail" },
  { title: "worldCup.betH2HTitle", detail: "worldCup.betH2HDetail" },
];

const SOCIAL_HOOKS: TranslationKey[] = [
  "worldCup.hookNationalPride",
  "worldCup.hookInfluencers",
  "worldCup.hookSpanish",
];

export function WorldCupCampaignClient() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-[var(--color-background)] px-4 pb-32 pt-8 text-[var(--color-text-primary)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <Link href="/sports-calendar" className="text-sm font-bold text-[var(--color-brand-primary)] hover:underline">
          {t("worldCup.back")}
        </Link>

        <header className="relative overflow-hidden rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)]">
          <div className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(circle at 22% 20%, rgba(34,197,94,0.32), transparent 32%), radial-gradient(circle at 82% 10%, rgba(239,68,68,0.34), transparent 28%), linear-gradient(135deg, rgba(255,255,255,0.08), transparent 52%)" }} />
          <div className="relative grid gap-6 p-5 lg:grid-cols-[1fr_360px] lg:p-8">
            <div className="flex flex-col justify-between gap-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("worldCup.eyebrow")}</p>
                <h1 className="mt-2 max-w-3xl font-display text-4xl font-black leading-none tracking-tight text-[var(--color-card-text)] sm:text-6xl">
                  {t("worldCup.title")}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-card-muted)]">
                  {t("worldCup.intro")}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/card" className="rounded-xl bg-[var(--color-brand-primary)] px-5 py-4 text-center text-sm font-black text-white hover:bg-red-500">
                  {t("worldCup.primaryCta")}
                </Link>
                <Link href="/leagues" className="rounded-xl border border-[var(--color-card-border)] px-5 py-4 text-center text-sm font-black text-[var(--color-card-text)] hover:border-[var(--color-brand-primary)]">
                  {t("worldCup.secondaryCta")}
                </Link>
              </div>
            </div>

            <div className="relative min-h-72 overflow-hidden rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-5">
              <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,rgba(34,197,94,0.34))]" />
              <div className="absolute left-1/2 top-10 h-40 w-40 -translate-x-1/2 rounded-full border-4 border-white/70 shadow-[0_0_60px_rgba(255,255,255,0.14)]" />
              <div className="absolute left-1/2 top-20 h-px w-60 -translate-x-1/2 bg-white/20" />
              <Image src="/mascots/scout-sports.png" alt="" width={260} height={260} priority className="relative z-10 mx-auto h-60 w-60 object-contain" />
              <div className="relative z-10 mt-2 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)]/90 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("worldCup.visualLabel")}</p>
                <p className="mt-1 text-sm font-black text-[var(--color-card-text)]">{t("worldCup.visualTitle")}</p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-4">
          {CAMPAIGN_STATS.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
              <p className="text-2xl font-black text-[var(--color-card-text)]">{stat.value}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[var(--color-card-muted)]">{t(stat.label)}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div id="free-card" className="scroll-mt-6 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("worldCup.freePlayEyebrow")}</p>
            <h2 className="mt-2 text-2xl font-black text-[var(--color-card-text)]">{t("worldCup.freePlayTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-card-muted)]">{t("worldCup.freePlayBody")}</p>
            <div className="mt-4 grid gap-2">
              {CAMPAIGN_STEPS.map((step, index) => (
                <div key={step} className="grid grid-cols-[32px_1fr] gap-3 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-brand-primary)] text-xs font-black text-white">{index + 1}</span>
                  <p className="text-sm font-semibold leading-relaxed text-[var(--color-card-text)]">{t(step)}</p>
                </div>
              ))}
            </div>
          </div>

          <div id="live-bets" className="scroll-mt-6 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("worldCup.liveBetsEyebrow")}</p>
            <h2 className="mt-2 text-2xl font-black text-[var(--color-card-text)]">{t("worldCup.liveBetsTitle")}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {LIVE_BETS.map((item) => (
                <article key={item.title} className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-4">
                  <h3 className="text-sm font-black text-[var(--color-card-text)]">{t(item.title)}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--color-card-muted)]">{t(item.detail)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("worldCup.calendarEyebrow")}</p>
            <h2 className="mt-2 text-2xl font-black text-[var(--color-card-text)]">{t("worldCup.calendarTitle")}</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {[
                ["worldCup.dateOpen", "Jun 11"],
                ["worldCup.dateKnockout", "Jun 28"],
                ["worldCup.dateFinal", "Jul 19"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3">
                  <p className="text-xl font-black text-[var(--color-card-text)]">{value}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[var(--color-card-muted)]">{t(label as TranslationKey)}</p>
                </div>
              ))}
            </div>
          </div>

          <aside id="leaderboards" className="scroll-mt-6 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("worldCup.growthEyebrow")}</p>
            <h2 className="mt-2 text-2xl font-black text-[var(--color-card-text)]">{t("worldCup.growthTitle")}</h2>
            <div className="mt-4 grid gap-2">
              {SOCIAL_HOOKS.map((hook) => (
                <p key={hook} className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3 text-sm font-semibold leading-relaxed text-[var(--color-card-text)]">{t(hook)}</p>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
