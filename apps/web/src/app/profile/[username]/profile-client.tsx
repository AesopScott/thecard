"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  getPublicBetHistory,
  getPublicLeagueSummaries,
  getPublicSettledPositions,
  getUserProfileByUsername,
  type PublicBetRecord,
  type PublicLeagueSummary,
  type SettledPositionRecord,
  type UserProfile,
} from "@/lib/user-store";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
import { ThemePicker } from "@/components/theme-picker";
import { friendLeagueNumberFromId } from "@/lib/league-store";
import { getLeaguesByGroup, getSportLeagueById, leagueTypeBadge, sportLeagueIdFromPaidLeagueId } from "@/lib/sport-leagues";
import { ACTIVE_SEASON, GLOBAL_LEAGUE } from "@/lib/season-store";

interface ProfileClientProps {
  username: string;
}

export function ProfileClient({ username }: ProfileClientProps) {
  const { username: currentUsername } = useAuth();
  const { t } = useI18n();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settledPositions, setSettledPositions] = useState<SettledPositionRecord[]>([]);
  const [leagueSummaries, setLeagueSummaries] = useState<PublicLeagueSummary[]>([]);
  const [betHistory, setBetHistory] = useState<PublicBetRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getUserProfileByUsername(username)
      .then(async (data) => {
        if (cancelled) return;
        setProfile(data);
        if (data) {
          const [positions, leagues, bets] = await Promise.all([
            getPublicSettledPositions(data.uid),
            getPublicLeagueSummaries(data.uid),
            getPublicBetHistory(data.uid),
          ]);
          setSettledPositions(positions);
          setLeagueSummaries(leagues);
          setBetHistory(bets);
        } else {
          setSettledPositions([]);
          setLeagueSummaries([]);
          setBetHistory([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
        <div className="h-24 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)]" />
        <div className="h-28 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-10 text-center">
        <h1 className="text-2xl font-black text-[var(--color-card-text)]">{t("profile.notFound")}</h1>
        <p className="text-sm text-[var(--color-card-muted)]">{t("profile.notClaimed", { username: username.toLowerCase() })}</p>
        <Link href="/leaderboard" className="mx-auto rounded-lg border border-[var(--color-card-border)] px-4 py-2 text-xs font-bold text-[var(--color-card-text)]">
          {t("profile.backLeaderboard")}
        </Link>
      </div>
    );
  }

  const score = Math.round(profile.calibrationScore);
  const avgBrier = profile.avgBrierScore === null ? "-" : profile.avgBrierScore.toFixed(3);
  const isOwnProfile = currentUsername === profile.username;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6">
      <header className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-card-accent)] text-xl font-black text-white">
            {profile.photoURL ? (
              <Image src={profile.photoURL} alt="" width={64} height={64} className="h-full w-full object-cover" unoptimized />
            ) : (
              profile.username[0]?.toUpperCase() ?? "?"
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-black text-[var(--color-card-text)]">@{profile.username}</h1>
                {profile.emailVerified && (
                  <span className="rounded-full border border-[var(--color-brand-primary)]/30 px-2 py-0.5 text-[10px] font-bold text-[var(--color-brand-primary)]">
                    {t("account.verified")}
                  </span>
                )}
              </div>
              {isOwnProfile && (
                <Link
                  href="/support"
                  className="shrink-0 rounded-lg border border-[var(--color-card-border)] px-3 py-2 text-xs font-black text-[var(--color-card-text)] hover:border-[var(--color-brand-primary)]"
                >
                  {t("profile.openSupport")}
                </Link>
              )}
            </div>
            <p className="mt-1 text-sm text-[var(--color-card-muted)]">
              {profile.teamName ? t("profile.teamForecaster", { team: profile.teamName }) : t("profile.independentForecaster")}
            </p>
            {profile.countryName && (
              <p className="mt-1 text-xs font-bold text-[var(--color-brand-primary)]">
                {profile.countryName}
              </p>
            )}
          </div>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-3">
        {[
          { label: t("leaderboard.calibrationTab"), value: profile.resolvedCount >= 5 ? String(score) : "-" },
          { label: "Brier", value: avgBrier },
          { label: t("profile.resolved"), value: String(profile.resolvedCount) },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-3 text-center"
          >
            <p className="text-xl font-black text-[var(--color-card-text)]">{value}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--color-card-muted)]">{label}</p>
          </div>
        ))}
      </section>

      {isOwnProfile && <ThemePicker />}

      <section className="grid gap-4 lg:grid-cols-3 lg:items-start">
        <LeagueBetHistory bets={betHistory} t={t} />
        <LeagueBankrolls leagues={leagueSummaries} t={t} />
        <PositionHistory positions={settledPositions} username={profile.username} t={t} />
      </section>
    </div>
  );
}

function leagueLabel(summary: PublicLeagueSummary): { name: string; meta: string } {
  if (summary.kind === "season") {
    const paidSportLeagueId = sportLeagueIdFromPaidLeagueId(summary.leagueId);
    const paidSportLeague = paidSportLeagueId ? getSportLeagueById(paidSportLeagueId) : null;
    if (paidSportLeague) {
      return {
        name: `${paidSportLeague.name} (Paid)`,
        meta: `Paid ${leagueTypeBadge(paidSportLeague.type, paidSportLeague.half)} - ${paidSportLeague.sport.toUpperCase()}`,
      };
    }
    return {
      name: `${GLOBAL_LEAGUE.name} League`,
      meta: `Aggregate leaderboard - ${ACTIVE_SEASON.name}`,
    };
  }
  const friendNumber = friendLeagueNumberFromId(summary.leagueId);
  if (friendNumber) {
    return {
      name: `Friends League #${friendNumber}`,
      meta: "Free friends league - no payouts",
    };
  }
  const sportLeague = getLeaguesByGroup()
    .flatMap((group) => group.leagues)
    .find((league) => league.id === summary.leagueId);
  if (sportLeague) {
    return {
      name: sportLeague.name,
      meta: `Free league - ${leagueTypeBadge(sportLeague.type, sportLeague.half)}`,
    };
  }
  return {
    name: summary.leagueId,
    meta: summary.kind === "free" ? "Free league" : "League",
  };
}

function leagueDisplayName(leagueId: string): string {
  if (leagueId === GLOBAL_LEAGUE.id) return `${GLOBAL_LEAGUE.name} League`;
  const paidSportLeagueId = sportLeagueIdFromPaidLeagueId(leagueId);
  const paidSportLeague = paidSportLeagueId ? getSportLeagueById(paidSportLeagueId) : null;
  if (paidSportLeague) return `${paidSportLeague.name} (Paid)`;
  const friendNumber = friendLeagueNumberFromId(leagueId);
  if (friendNumber) return `Friends League #${friendNumber}`;
  return getLeaguesByGroup().flatMap((group) => group.leagues).find((league) => league.id === leagueId)?.name ?? leagueId;
}

function LeagueBankrolls({ leagues, t }: { leagues: PublicLeagueSummary[]; t: ReturnType<typeof useI18n>["t"] }) {
  const bankrolledLeagues = leagues.filter((league) => league.leagueId !== GLOBAL_LEAGUE.id);
  const hasGlobalLeague = leagues.some((league) => league.leagueId === GLOBAL_LEAGUE.id);
  const totals = bankrolledLeagues.reduce(
    (acc, league) => ({
      bankroll: acc.bankroll + league.currentBankroll,
      bets: acc.bets + league.betCount,
      pnl: acc.pnl + (league.currentBankroll - league.startingBankroll),
    }),
    { bankroll: 0, bets: 0, pnl: 0 }
  );

  return (
    <section className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("profile.leagueBankrolls")}</p>
          <p className="mt-1 text-xs text-[var(--color-card-muted)]">
            {t("profile.bankrollBody")}
          </p>
        </div>
        {leagues.length > 0 && (
          <div className="shrink-0 text-right">
            <p className="text-sm font-black text-[var(--color-card-text)]">{leagues.length}</p>
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-card-muted)]">{t("profile.leagues")}</p>
          </div>
        )}
      </div>

      {leagues.length === 0 ? (
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-card-muted)]">
          {t("profile.noLeaguesJoined")}
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {hasGlobalLeague && (
            <div className="rounded-lg border border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/10 p-3">
              <p className="text-sm font-black text-[var(--color-card-text)]">{GLOBAL_LEAGUE.name} League</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-card-muted)]">
                {t("profile.globalAggregateNoBankroll")}
              </p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: t("profile.totalShown"), value: `$${totals.bankroll.toLocaleString()}` },
              { label: t("profile.netPl"), value: `${totals.pnl >= 0 ? "+" : ""}$${totals.pnl.toLocaleString()}` },
              { label: t("profile.bets"), value: totals.bets.toLocaleString() },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-2 text-center">
                <p className="text-sm font-black text-[var(--color-card-text)]">{stat.value}</p>
                <p className="mt-1 text-[9px] uppercase tracking-wider text-[var(--color-card-muted)]">{stat.label}</p>
              </div>
            ))}
          </div>

          {bankrolledLeagues.length === 0 && (
            <p className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3 text-xs leading-relaxed text-[var(--color-card-muted)]">
              {t("profile.noBankrolledLeagues")}
            </p>
          )}

          {bankrolledLeagues.map((league) => {
            const pnl = league.currentBankroll - league.startingBankroll;
            const label = leagueLabel(league);
            return (
              <div key={`${league.kind}-${league.leagueId}`} className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--color-card-text)]">{label.name}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-card-muted)]">
                      {label.meta}{league.isBust ? " / Bust" : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-black text-[var(--color-card-text)]">
                      ${league.currentBankroll.toLocaleString()}
                    </p>
                    <p className={pnl >= 0 ? "text-[10px] font-bold text-[var(--color-card-yes)]" : "text-[10px] font-bold text-[var(--color-card-no)]"}>
                      {pnl >= 0 ? "+" : ""}${pnl.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--color-card-muted)]">
                  <span>{t("profile.betCount", { count: league.betCount.toLocaleString() })}</span>
                  <span>{t("profile.startingBankroll", { amount: `$${league.startingBankroll.toLocaleString()}` })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function LeagueBetHistory({ bets, t }: { bets: PublicBetRecord[]; t: ReturnType<typeof useI18n>["t"] }) {
  const betsByLeague = bets.reduce<Record<string, PublicBetRecord[]>>((acc, bet) => {
    acc[bet.leagueId] = [...(acc[bet.leagueId] ?? []), bet];
    return acc;
  }, {});
  const leagueIds = Object.keys(betsByLeague);

  return (
    <section className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("profile.everyBetByLeague")}</p>
          <p className="mt-1 text-xs text-[var(--color-card-muted)]">
            {t("profile.betLedgerBody")}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-black text-[var(--color-card-text)]">{bets.length}</p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-card-muted)]">{t("profile.bets")}</p>
        </div>
      </div>

      {bets.length === 0 ? (
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-card-muted)]">
          {t("profile.noBetLedger")}
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {leagueIds.map((leagueId) => {
            const leagueBets = betsByLeague[leagueId] ?? [];
            const totalAmount = leagueBets.reduce((sum, bet) => sum + bet.amountUsd, 0);
            return (
              <div key={leagueId} className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[var(--color-card-text)]">{leagueDisplayName(leagueId)}</p>
                    <p className="text-[10px] text-[var(--color-card-muted)]">{t("profile.leagueBetsStaked", { count: String(leagueBets.length), amount: `$${totalAmount.toFixed(2)}` })}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-col gap-2">
                  {leagueBets.map((bet) => (
                    <div key={bet.id} className="rounded-md border border-[var(--color-card-border)] bg-[var(--color-card-surface)] px-3 py-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-[var(--color-card-text)]">{bet.marketTitle}</p>
                          <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--color-card-muted)]">
                            {bet.sport} / {bet.side.toUpperCase()} / {Math.round(bet.averagePrice * 100)}c
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-black text-[var(--color-card-text)]">${bet.amountUsd.toFixed(2)}</p>
                          <p className="text-[10px] text-[var(--color-card-muted)]">{new Date(bet.placedAtMs).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function PositionHistory({ positions, username, t }: { positions: SettledPositionRecord[]; username: string; t: ReturnType<typeof useI18n>["t"] }) {
  const latestPositions = positions.slice(0, 3);
  const stats = positions.reduce(
    (acc, position) => ({
      costBasis: acc.costBasis + position.costBasis,
      payout: acc.payout + position.payout,
      pnl: acc.pnl + position.pnl,
      wins: acc.wins + (position.pnl > 0 ? 1 : 0),
      losses: acc.losses + (position.pnl < 0 ? 1 : 0),
    }),
    { costBasis: 0, payout: 0, pnl: 0, wins: 0, losses: 0 }
  );
  const roi = stats.costBasis > 0 ? (stats.pnl / stats.costBasis) * 100 : 0;
  const winRate = positions.length > 0 ? (stats.wins / positions.length) * 100 : 0;

  return (
    <section className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("profile.positionHistory")}</p>
        <Link href={`/profile/positions?u=${username}`} className="text-xs font-semibold text-[var(--color-card-muted)] hover:text-[var(--color-brand-primary)]">
          {t("profile.viewAll")}
        </Link>
      </div>

      {positions.length === 0 ? (
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-card-muted)]">
          {t("profile.noClosedPositions")}
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                label: t("profile.netPl"),
                value: `${stats.pnl >= 0 ? "+" : ""}$${stats.pnl.toFixed(2)}`,
                tone: stats.pnl >= 0 ? "text-[var(--color-card-yes)]" : "text-[var(--color-card-no)]",
              },
              {
                label: "ROI",
                value: `${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%`,
                tone: roi >= 0 ? "text-[var(--color-card-yes)]" : "text-[var(--color-card-no)]",
              },
              {
                label: t("profile.winRate"),
                value: `${winRate.toFixed(0)}%`,
                tone: "text-[var(--color-card-text)]",
              },
              {
                label: t("profile.volume"),
                value: `$${stats.costBasis.toFixed(2)}`,
                tone: "text-[var(--color-card-text)]",
              },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3">
                <p className={`text-lg font-black ${stat.tone}`}>{stat.value}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--color-card-muted)]">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[var(--color-card-muted)]">
            <span>{t("profile.latestPositions")}</span>
            <span>{t("profile.closedRecord", { count: String(positions.length), wins: String(stats.wins), losses: String(stats.losses) })}</span>
          </div>

          <div className="flex flex-col gap-2">
            {latestPositions.map((position) => {
              const isProfit = position.pnl >= 0;
              return (
                <div
                  key={position.id}
                  className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[var(--color-card-text)]">
                        {position.marketTitle}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-card-muted)]">
                        {position.side.toUpperCase()} / {position.outcome === "sold" ? t("profile.sold") : t("profile.settledOutcome", { outcome: position.outcome.toUpperCase() })}
                      </p>
                      {position.leagueId && (
                        <p className="mt-1 truncate text-[10px] font-bold text-[var(--color-brand-primary)]">
                          {leagueDisplayName(position.leagueId)}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`text-sm font-black ${isProfit ? "text-[var(--color-card-yes)]" : "text-[var(--color-card-no)]"}`}>
                        {isProfit ? "+" : ""}${position.pnl.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-[var(--color-card-muted)]">
                        {t("profile.paidAmount", { amount: `$${position.payout.toFixed(2)}` })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--color-card-muted)]">
                    <span>{t("profile.contractAvg", { contracts: position.contracts.toFixed(1), price: String(Math.round(position.averagePrice * 100)) })}</span>
                    <span>{t("profile.costAmount", { amount: `$${position.costBasis.toFixed(2)}` })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
