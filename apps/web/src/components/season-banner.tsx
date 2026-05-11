"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
import {
  ACTIVE_SEASON,
  GLOBAL_LEAGUE,
  SEASON_BANKROLL_EVENT,
  STARTING_BANKROLL,
  daysLeftInSeason,
  daysUntilSeason,
  getBankroll,
  getExistingUserSeasonMembership,
  getSeasonNumber,
  getSeasonStatus,
  initGlobalLeague,
  joinUserSeasonLeague,
} from "@/lib/season-store";

interface SeasonBannerProps {
  variant?: "compact" | "full";
}

export function SeasonBanner({ variant = "compact" }: SeasonBannerProps) {
  const { user, verificationRequired } = useAuth();
  const { t } = useI18n();
  const [bankroll, setBankroll] = useState(STARTING_BANKROLL);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    initGlobalLeague();
    function refresh() {
      if (user && !verificationRequired) {
        getExistingUserSeasonMembership(user.uid)
          .then((membership) => {
            setJoined(Boolean(membership));
            setBankroll(membership?.currentBankroll ?? STARTING_BANKROLL);
          })
          .catch(() => {
            setJoined(false);
            setBankroll(getBankroll(GLOBAL_LEAGUE.id));
          });
      } else {
        setJoined(false);
        setBankroll(getBankroll(GLOBAL_LEAGUE.id));
      }
    }
    refresh();

    function onUpdate() { refresh(); }
    window.addEventListener(SEASON_BANKROLL_EVENT, onUpdate);
    return () => window.removeEventListener(SEASON_BANKROLL_EVENT, onUpdate);
  }, [user, verificationRequired]);

  const status = getSeasonStatus(ACTIVE_SEASON);

  async function joinGlobalLeague() {
    if (!user || verificationRequired) return;
    const membership = await joinUserSeasonLeague(user.uid);
    setJoined(true);
    setBankroll(membership.currentBankroll);
    window.dispatchEvent(new Event(SEASON_BANKROLL_EVENT));
  }

  if (variant === "compact") {
    const canJoin = Boolean(user && !verificationRequired && !joined);
    return (
      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-2)] px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-[10px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest truncate">
            Season {getSeasonNumber(ACTIVE_SEASON)} - {ACTIVE_SEASON.name}
          </p>
          {status === "upcoming" && (
            <p className="text-xs text-[var(--color-text-muted)]">
              {t("shared.opensInDays", { days: String(daysUntilSeason(ACTIVE_SEASON)), amount: `$${STARTING_BANKROLL.toLocaleString()}` })}
            </p>
          )}
          {status === "active" && (
            <p className="text-xs text-[var(--color-text-muted)]">
              {joined
                ? t("shared.daysLeftPrize", { days: String(daysLeftInSeason(ACTIVE_SEASON)), amount: `$${ACTIVE_SEASON.prizePoolEstimate.toLocaleString()}+` })
                : t("shared.joinBeforePositionsBankroll", { amount: `$${STARTING_BANKROLL.toLocaleString()}` })}
            </p>
          )}
          {status === "closed" && (
            <p className="text-xs text-[var(--color-text-muted)]">{t("shared.seasonEnded")}</p>
          )}
        </div>

        <div className="flex flex-col items-end shrink-0">
          {canJoin ? (
            <button
              type="button"
              onClick={joinGlobalLeague}
              className="rounded-lg bg-[var(--color-brand-primary)] px-3 py-2 text-xs font-black text-white"
            >
              {t("leagues.join")}
            </button>
          ) : (
            <>
              <span className="text-sm font-black text-[var(--color-card-text)]">
                {joined ? t("shared.joined") : t("shared.aggregate")}
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)]">{t("shared.noBankroll")}</span>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-brand-primary)]/30 bg-gradient-to-br from-[var(--color-surface-2)] to-[var(--color-background)] p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest">
            Season {getSeasonNumber(ACTIVE_SEASON)}
          </p>
          <p className="text-lg font-black text-[var(--color-card-text)] leading-tight">
            {ACTIVE_SEASON.name}
          </p>
        </div>
        <div className="flex flex-col items-end shrink-0">
          {status === "upcoming" && (
            <>
              <span className="text-2xl font-black text-[var(--color-card-text)]">
                {daysUntilSeason(ACTIVE_SEASON)}
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)]">{t("shared.daysToOpen")}</span>
            </>
          )}
          {status === "active" && (
            <>
              <span className="text-2xl font-black text-[var(--color-card-text)]">
                {daysLeftInSeason(ACTIVE_SEASON)}
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)]">{t("shared.daysLeft")}</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">
            {t("shared.leagueStatus")}
          </span>
          <span className="text-base font-black text-[var(--color-card-text)]">
            {joined ? t("shared.joined") : t("shared.notJoined")}
          </span>
          {joined && <span className="text-[10px] text-[var(--color-text-muted)]">{t("shared.aggregateNoBankroll")}</span>}
          {!joined && <span className="text-[10px] text-[var(--color-text-muted)]">{t("shared.joinBeforePositions")}</span>}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">{t("leagues.prizePool")}</span>
          <span className="text-base font-black text-[var(--color-card-text)]">
            ${ACTIVE_SEASON.prizePoolEstimate.toLocaleString()}+
          </span>
          <span className="text-[10px] text-[var(--color-text-muted)]">{t("shared.top10Split")}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">{t("leagues.players")}</span>
          <span className="text-base font-black text-[var(--color-card-text)]">
            {GLOBAL_LEAGUE.memberCount.toLocaleString()}
          </span>
          <span className="text-[10px] text-[var(--color-text-muted)]">{t("shared.inGlobal")}</span>
        </div>
      </div>

      {status === "upcoming" && (
        <div className="rounded-lg bg-[var(--color-brand-primary)]/10 border border-[var(--color-brand-primary)]/20 px-3 py-2">
          <p className="text-xs text-[var(--color-brand-primary)] font-semibold">
            {t("shared.opensDateBankroll", { date: ACTIVE_SEASON.startDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }), amount: `$${STARTING_BANKROLL.toLocaleString()}` })}
          </p>
        </div>
      )}

      {user && !verificationRequired && !joined && (
        <button
          type="button"
          onClick={joinGlobalLeague}
          className="rounded-lg bg-[var(--color-brand-primary)] px-4 py-3 text-sm font-black text-white"
        >
          {t("leagues.join")}
        </button>
      )}
    </div>
  );
}
