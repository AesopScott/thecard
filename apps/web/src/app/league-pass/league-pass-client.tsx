"use client";

import Link from "next/link";

import { useI18n } from "@/contexts/i18n-context";
import { type TranslationKey } from "@/lib/i18n";

const FREE_FEATURES: TranslationKey[] = [
  "leaguePass.freeFeatureSlots",
  "leaguePass.freeFeatureFriends",
  "leaguePass.freeFeatureGlobal",
  "leaguePass.freeFeatureBankrolls",
];

const PASS_FEATURES: TranslationKey[] = [
  "leaguePass.passFeatureFreeSlots",
  "leaguePass.passFeatureFriends",
  "leaguePass.passFeaturePaid",
  "leaguePass.passFeatureGlobal",
];

const PRIZE_NOTES: TranslationKey[] = [
  "leaguePass.prizeNotePaid",
  "leaguePass.prizeNoteFree",
  "leaguePass.prizeNoteLabels",
];

export function LeaguePassClient() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-[var(--color-background)] px-4 pb-32 pt-8 text-[var(--color-text-primary)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <Link href="/leagues" className="text-sm font-bold text-[var(--color-brand-primary)] hover:underline">
          {t("leaguePass.back")}
        </Link>

        <header className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("leaguePass.eyebrow")}</p>
          <h1 className="mt-2 font-display text-4xl font-black text-[var(--color-card-text)]">{t("leaguePass.title")}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-card-muted)]">
            {t("leaguePass.intro")}
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-2">
          <PlanCard
            eyebrow={t("leaguePass.freeEyebrow")}
            title={t("leaguePass.freeTitle")}
            price="$0"
            detail={t("leaguePass.freeDetail")}
            features={FREE_FEATURES.map((key) => t(key))}
            cta={t("leaguePass.included")}
            muted
          />
          <PlanCard
            eyebrow={t("leaguePass.passEyebrow")}
            title={t("leaguePass.passTitle")}
            price="$10/mo"
            detail={t("leaguePass.passDetail")}
            features={PASS_FEATURES.map((key) => t(key))}
            cta={t("leaguePass.checkoutSoon")}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("leaguePass.prizeEyebrow")}</p>
            <h2 className="mt-2 text-2xl font-black text-[var(--color-card-text)]">{t("leaguePass.buyingTitle")}</h2>
            <div className="mt-4 grid gap-3">
              {PRIZE_NOTES.map((note) => (
                <div key={note} className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3">
                  <p className="text-sm leading-relaxed text-[var(--color-card-muted)]">{t(note)}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("leaguePass.extraSlots")}</p>
            <p className="mt-2 text-3xl font-black text-[var(--color-card-text)]">$2/mo</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-card-muted)]">
              {t("leaguePass.extraBody")}
            </p>
            <button
              type="button"
              disabled
              className="mt-4 w-full rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] px-4 py-3 text-sm font-black text-[var(--color-card-muted)]"
            >
              {t("leaguePass.addonsSoon")}
            </button>
          </aside>
        </section>

        <section className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("leaguePass.globalEyebrow")}</p>
          <h2 className="mt-2 text-2xl font-black text-[var(--color-card-text)]">{t("leaguePass.globalTitle")}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--color-card-muted)]">
            {t("leaguePass.globalBody")}
          </p>
        </section>

        <section className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("leaguePass.prizeModelEyebrow")}</p>
          <h2 className="mt-2 text-2xl font-black text-[var(--color-card-text)]">{t("leaguePass.prizeModelTitle")}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--color-card-muted)]">
            {t("leaguePass.prizeModelBody")}
          </p>
          <Link href="/prize-math" className="mt-4 inline-flex rounded-xl border border-[var(--color-card-border)] px-4 py-3 text-sm font-black text-[var(--color-card-text)] hover:border-[var(--color-brand-primary)]">
            {t("leaguePass.openPrizeMath")}
          </Link>
        </section>
      </div>
    </div>
  );
}

function PlanCard({
  eyebrow,
  title,
  price,
  detail,
  features,
  cta,
  muted = false,
}: {
  eyebrow: string;
  title: string;
  price: string;
  detail: string;
  features: string[];
  cta: string;
  muted?: boolean;
}) {
  return (
    <article className={`rounded-xl border p-5 ${muted ? "border-[var(--color-card-border)] bg-[var(--color-card-surface)]" : "border-[var(--color-brand-primary)]/40 bg-[var(--color-card-surface)]"}`}>
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{eyebrow}</p>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[var(--color-card-text)]">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-card-muted)]">{detail}</p>
        </div>
        <p className="shrink-0 text-2xl font-black text-[var(--color-card-text)]">{price}</p>
      </div>
      <div className="mt-4 grid gap-2">
        {features.map((feature) => (
          <div key={feature} className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] px-3 py-2">
            <p className="text-sm font-bold text-[var(--color-card-text)]">{feature}</p>
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled
        className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-black ${muted ? "border border-[var(--color-card-border)] text-[var(--color-card-muted)]" : "bg-[var(--color-brand-primary)] text-white opacity-80"}`}
      >
        {cta}
      </button>
    </article>
  );
}
