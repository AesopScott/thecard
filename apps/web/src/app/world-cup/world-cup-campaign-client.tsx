"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { EmailVerificationNotice } from "@/components/email-verification-notice";
import { SignInSheet } from "@/components/sign-in-sheet";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
import {
  STARTING_BANKROLL,
  getUserLeagueMembership,
  joinUserLeague,
  subscribeFreeLeagueLeaderboard,
  type FreeLeagueLeaderboardEntry,
} from "@/lib/league-store";
import { WORLD_CUP_LEAGUE_ID } from "@/lib/sport-leagues";
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

const WORLD_CUP_PAYOUTS: Record<number, number> = {
  1: 500,
  2: 250,
  3: 100,
  4: 50,
  5: 50,
  6: 50,
};

const PREVIEW_ROWS: FreeLeagueLeaderboardEntry[] = [
  { uid: "preview-1", username: "azteca11", displayName: "Azteca11", photoURL: null, countryCode: "MX", countryName: "Mexico", bankroll: 1430, shadowWinnings: 430, betCount: 18, joinedAtMs: Date.now() - 5 * 86_400_000, rank: 1 },
  { uid: "preview-2", username: "goalrush", displayName: "GoalRush", photoURL: null, countryCode: "US", countryName: "United States", bankroll: 1315, shadowWinnings: 315, betCount: 15, joinedAtMs: Date.now() - 4 * 86_400_000, rank: 2 },
  { uid: "preview-3", username: "redcardread", displayName: "RedCardRead", photoURL: null, countryCode: "CA", countryName: "Canada", bankroll: 1190, shadowWinnings: 190, betCount: 12, joinedAtMs: Date.now() - 3 * 86_400_000, rank: 3 },
  { uid: "preview-4", username: "cornerking", displayName: "CornerKing", photoURL: null, countryCode: "BR", countryName: "Brazil", bankroll: 1085, shadowWinnings: 85, betCount: 10, joinedAtMs: Date.now() - 2 * 86_400_000, rank: 4 },
  { uid: "preview-5", username: "lateequalizer", displayName: "LateEqualizer", photoURL: null, countryCode: "AR", countryName: "Argentina", bankroll: 1010, shadowWinnings: 10, betCount: 8, joinedAtMs: Date.now() - 86_400_000, rank: 5 },
];

function countryFlag(code?: string | null): string {
  if (!code || code === "OTHER" || code.length !== 2) return String.fromCodePoint(0x1F310);
  const upper = code.toUpperCase();
  const points = [...upper].map((char) => 0x1F1E6 + char.charCodeAt(0) - 65);
  return String.fromCodePoint(...points);
}

function WorldCupPayoutSummary() {
  const { t } = useI18n();
  return (
    <div className="rounded-xl border border-[var(--color-brand-primary)]/40 bg-[var(--color-brand-primary)]/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("worldCup.payoutEyebrow")}</p>
          <h3 className="mt-1 text-lg font-black text-[var(--color-card-text)]">{t("worldCup.payoutTitle")}</h3>
        </div>
        <span className="rounded-full bg-[var(--color-brand-primary)] px-3 py-1 text-xs font-black text-white">$1,000</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {[
          [t("worldCup.payoutFirst"), "$500"],
          [t("worldCup.payoutSecond"), "$250"],
          [t("worldCup.payoutThird"), "$100"],
          [t("worldCup.payoutFourthSixth"), "$50"],
        ].map(([label, amount]) => (
          <div key={label} className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3">
            <p className="text-lg font-black text-[var(--color-card-text)]">{amount}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[var(--color-card-muted)]">{label}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-[var(--color-card-muted)]">{t("worldCup.payoutBody")}</p>
    </div>
  );
}

function WorldCupLeaderboard({
  entries,
  loading,
}: {
  entries: FreeLeagueLeaderboardEntry[];
  loading: boolean;
}) {
  const { t } = useI18n();
  const rows = entries.length > 0 ? entries : PREVIEW_ROWS;
  const isPreview = entries.length === 0;

  return (
    <div id="leaderboards" className="scroll-mt-6 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("worldCup.leaderboardEyebrow")}</p>
          <h3 className="mt-1 text-lg font-black text-[var(--color-card-text)]">{t("worldCup.leaderboardTitle")}</h3>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-card-muted)]">
            {isPreview ? t("worldCup.leaderboardPreview") : t("worldCup.leaderboardLive")}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-[var(--color-card-border)] px-2 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--color-card-muted)]">
          {loading ? t("worldCup.loadingBoard") : `${rows.length} ${t("leaderboard.rows")}`}
        </span>
      </div>
      <div className="grid grid-cols-[44px_minmax(0,1fr)_72px_48px] gap-2 border-b border-[var(--color-card-border)] pb-2 text-[10px] font-black uppercase tracking-widest text-[var(--color-card-muted)]">
        <span>{t("leaderboard.rank")}</span>
        <span>{t("leaderboard.player")}</span>
        <span className="text-right">{t("leaderboard.bankroll")}</span>
        <span className="text-right">{t("leaderboard.bets")}</span>
      </div>
      <div className="mt-2 grid gap-1.5">
        {rows.slice(0, 10).map((entry, index) => {
          const rank = entry.rank || index + 1;
          const pnl = entry.bankroll - STARTING_BANKROLL;
          const payout = WORLD_CUP_PAYOUTS[rank] ?? 0;
          return (
            <div
              key={`${entry.uid}-${rank}`}
              className={`grid grid-cols-[44px_minmax(0,1fr)_72px_48px] items-center gap-2 rounded-lg px-2 py-2 text-xs ${
                entry.isYou ? "bg-[var(--color-brand-dim)] text-[var(--color-card-text)]" : "bg-black/10 text-[var(--color-card-muted)]"
              }`}
            >
              <span className="font-black text-[var(--color-card-text)]">#{rank}</span>
              <div className="min-w-0">
                <p className="truncate font-black text-[var(--color-card-text)]">
                  <span aria-hidden="true" className="mr-1.5">{countryFlag(entry.countryCode)}</span>
                  {entry.displayName}
                </p>
                <p className="truncate text-[10px]">
                  @{entry.username}
                  {entry.countryName ? ` / ${entry.countryName}` : ""}
                  {payout > 0 ? ` / ${t("worldCup.payoutLabel")} $${payout}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="font-black text-[var(--color-card-text)]">${Math.round(entry.bankroll).toLocaleString()}</p>
                <p className={pnl >= 0 ? "text-[var(--color-card-yes)]" : "text-[var(--color-card-no)]"}>
                  {pnl >= 0 ? "+" : ""}${Math.round(pnl).toLocaleString()}
                </p>
              </div>
              <span className="text-right font-black text-[var(--color-card-text)]">{entry.betCount}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function WorldCupCampaignClient() {
  const { t } = useI18n();
  const { user, verificationRequired } = useAuth();
  const [signInOpen, setSignInOpen] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [leaderboardEntries, setLeaderboardEntries] = useState<FreeLeagueLeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  const refreshMembership = useCallback(async () => {
    if (!user) {
      setIsJoined(false);
      return;
    }
    const membership = await getUserLeagueMembership(user.uid, WORLD_CUP_LEAGUE_ID).catch(() => null);
    setIsJoined(Boolean(membership));
  }, [user]);

  useEffect(() => {
    void refreshMembership();
  }, [refreshMembership]);

  useEffect(() => {
    setLeaderboardLoading(true);
    return subscribeFreeLeagueLeaderboard(
      WORLD_CUP_LEAGUE_ID,
      (entries) => {
        setLeaderboardEntries(entries);
        setLeaderboardLoading(false);
      },
      user?.uid,
    );
  }, [user?.uid]);

  async function handleJoinWorldCupLeague() {
    if (!user) {
      setSignInOpen(true);
      return;
    }
    if (verificationRequired || joining) return;
    setJoining(true);
    setJoinError(null);
    try {
      await joinUserLeague(user.uid, WORLD_CUP_LEAGUE_ID);
      setIsJoined(true);
    } catch {
      setJoinError(t("worldCup.joinError"));
    } finally {
      setJoining(false);
    }
  }

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

        <section id="world-cup-league" className="scroll-mt-6 rounded-xl border border-[var(--color-brand-primary)]/50 bg-[var(--color-card-surface)] p-5 shadow-[0_0_35px_rgba(239,68,68,0.08)]">
          <div className="grid gap-5 lg:grid-cols-[1fr_300px] lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("worldCup.joinEyebrow")}</p>
              <h2 className="mt-2 text-2xl font-black text-[var(--color-card-text)]">{t("worldCup.joinTitle")}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-card-muted)]">{t("worldCup.joinBody")}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3">
                  <p className="text-xl font-black text-[var(--color-card-text)]">${STARTING_BANKROLL.toLocaleString()}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[var(--color-card-muted)]">{t("worldCup.joinBankroll")}</p>
                </div>
                <div className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3">
                  <p className="text-xl font-black text-[var(--color-card-text)]">{t("worldCup.joinFreeValue")}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[var(--color-card-muted)]">{t("worldCup.joinCost")}</p>
                </div>
                <div className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3">
                  <p className="text-xl font-black text-[var(--color-card-text)]">104</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[var(--color-card-muted)]">{t("worldCup.joinMatches")}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-4">
              <p className="text-sm font-black text-[var(--color-card-text)]">{t("worldCup.joinCardTitle")}</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-card-muted)]">{t("worldCup.joinCardBody")}</p>
              {user && verificationRequired && (
                <div className="mt-3">
                  <EmailVerificationNotice compact />
                </div>
              )}
              {joinError && <p className="mt-3 rounded-lg border border-[var(--color-danger)]/30 px-3 py-2 text-xs text-[var(--color-danger)]">{joinError}</p>}
              <button
                type="button"
                onClick={handleJoinWorldCupLeague}
                disabled={joining || isJoined || Boolean(user && verificationRequired)}
                className="mt-4 w-full rounded-lg bg-[var(--color-brand-primary)] px-4 py-3 text-sm font-black text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isJoined ? t("worldCup.joined") : joining ? t("worldCup.joining") : t("worldCup.joinButton")}
              </button>
              {isJoined && (
                <Link href="/card" className="mt-2 block rounded-lg border border-[var(--color-card-border)] px-4 py-3 text-center text-xs font-black text-[var(--color-card-text)] hover:border-[var(--color-brand-primary)]">
                  {t("worldCup.playAfterJoin")}
                </Link>
              )}
            </div>
          </div>
          <div className="mt-5">
            <WorldCupPayoutSummary />
          </div>
          <div className="mt-5">
            <WorldCupLeaderboard entries={leaderboardEntries} loading={leaderboardLoading} />
          </div>
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

          <aside id="distribution" className="scroll-mt-6 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5">
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
      <SignInSheet open={signInOpen} onClose={() => setSignInOpen(false)} />
    </div>
  );
}
