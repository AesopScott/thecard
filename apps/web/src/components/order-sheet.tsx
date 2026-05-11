"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
import { EmailVerificationNotice } from "./email-verification-notice";
import { LeagueMembershipRequiredError, placeAccountOrder } from "@/lib/account-order";
import {
  friendLeagueNumberFromId,
  getUserLeagueMemberships,
  isFriendLeagueId,
} from "@/lib/league-store";
import {
  GLOBAL_LEAGUE,
  SEASON_BANKROLL_EVENT,
  STARTING_BANKROLL,
  getUserSeasonMemberships,
} from "@/lib/season-store";
import {
  getLeagueStatus,
  getLeaguesByGroup,
  getSportLeagueById,
  leagueTypeBadge,
  sportLeagueIdFromPaidLeagueId,
} from "@/lib/sport-leagues";
import type { Market, Odds } from "@thecard/types";

export const ORDER_PLACED_EVENT = "thecard:order:placed";

interface OrderSheetProps {
  open: boolean;
  market: Market;
  side: "yes" | "no";
  odds: Odds;
  onClose: () => void;
}

type SheetState = "input" | "confirming" | "success";
type LeagueOption = { id: string; name: string; meta: string; bankroll: number };

function leagueLabel(leagueId: string): Pick<LeagueOption, "name" | "meta"> {
  if (leagueId === GLOBAL_LEAGUE.id) return { name: `${GLOBAL_LEAGUE.name} League`, meta: "Aggregate leaderboard - no bankroll" };
  const paidSportLeagueId = sportLeagueIdFromPaidLeagueId(leagueId);
  const paidSportLeague = paidSportLeagueId ? getSportLeagueById(paidSportLeagueId) : null;
  if (paidSportLeague) {
    return { name: `${paidSportLeague.name} (Paid)`, meta: `Paid league - ${leagueTypeBadge(paidSportLeague.type, paidSportLeague.half)}` };
  }
  const friendNumber = friendLeagueNumberFromId(leagueId);
  if (friendNumber) return { name: `Friends League #${friendNumber}`, meta: "Free friends league - no payouts" };
  const league = getLeaguesByGroup().flatMap((group) => group.leagues).find((item) => item.id === leagueId);
  if (league) return { name: league.name, meta: `Free league - ${leagueTypeBadge(league.type, league.half)}` };
  return { name: leagueId, meta: "League" };
}

export function OrderSheet({ open, market, side, odds, onClose }: OrderSheetProps) {
  const { user, verificationRequired } = useAuth();
  const { t } = useI18n();
  const [amount, setAmount] = useState("10");
  const [sheetState, setSheetState] = useState<SheetState>("input");
  const [orderError, setOrderError] = useState<string | null>(null);
  const [leagueOptions, setLeagueOptions] = useState<LeagueOption[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState("");

  const selectedLeague = leagueOptions.find((league) => league.id === selectedLeagueId) ?? null;
  const bankroll = selectedLeague?.bankroll ?? 0;

  useEffect(() => {
    function refresh() {
      if (!user) {
        setLeagueOptions([]);
        setSelectedLeagueId("");
        return;
      }
      Promise.all([
        getUserSeasonMemberships(user.uid),
        getUserLeagueMemberships(user.uid),
      ])
        .then(([seasonMemberships, freeMemberships]) => {
          const sportLeagues = getLeaguesByGroup().flatMap((group) => group.leagues);
          const next: LeagueOption[] = [];
          seasonMemberships.forEach((membership) => {
            const paidSportLeagueId = sportLeagueIdFromPaidLeagueId(membership.leagueId);
            const paidSportLeague = paidSportLeagueId ? getSportLeagueById(paidSportLeagueId) : null;
            const eligible = Boolean(paidSportLeague?.sport === market.sport && getLeagueStatus(paidSportLeague) !== "closed");
            if (!eligible) return;
            const label = leagueLabel(membership.leagueId);
            next.push({ ...label, id: membership.leagueId, bankroll: membership.currentBankroll });
          });
          freeMemberships.forEach((membership) => {
            const sportLeague = sportLeagues.find((league) => league.id === membership.leagueId);
            const eligible = isFriendLeagueId(membership.leagueId)
              || (sportLeague?.sport === market.sport && getLeagueStatus(sportLeague) !== "closed");
            if (!eligible) return;
            const label = leagueLabel(membership.leagueId);
            next.push({ ...label, id: membership.leagueId, bankroll: membership.currentBankroll });
          });
          setLeagueOptions(next);
          setSelectedLeagueId((current) => next.some((league) => league.id === current) ? current : next[0]?.id ?? "");
        })
        .catch(() => {
          setLeagueOptions([]);
          setSelectedLeagueId("");
        });
    }
    refresh();
    function onUpdate() { refresh(); }
    window.addEventListener(SEASON_BANKROLL_EVENT, onUpdate);
    window.addEventListener("thecard:league:bankroll", onUpdate);
    return () => {
      window.removeEventListener(SEASON_BANKROLL_EVENT, onUpdate);
      window.removeEventListener("thecard:league:bankroll", onUpdate);
    };
  }, [market.sport, user]);

  const price = side === "yes" ? odds.yes : odds.no;
  const priceCents = Math.round(price * 100);
  const dollarAmount = parseFloat(amount) || 0;
  const contracts = dollarAmount > 0 ? dollarAmount / price : 0;
  const payout = contracts;
  const sideColor = side === "yes" ? "var(--color-card-yes)" : "var(--color-card-no)";
  const sideDimColor = side === "yes" ? "var(--color-card-yes-dim)" : "var(--color-card-no-dim)";

  if (open && verificationRequired) {
    return (
      <AnimatePresence>
        <motion.div className="fixed inset-0 z-40 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-6 pb-10"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
        >
          <div className="mx-auto max-w-sm"><EmailVerificationNotice compact /></div>
        </motion.div>
      </AnimatePresence>
    );
  }

  async function handleConfirm() {
    if (!user || verificationRequired || !selectedLeague || dollarAmount <= 0 || dollarAmount > bankroll) return;
    setOrderError(null);
    setSheetState("confirming");
    try {
      const order = await placeAccountOrder({
        uid: user.uid,
        market,
        side,
        amountUsd: dollarAmount,
        leagueId: selectedLeague.id,
      });
      setLeagueOptions((current) => current.map((league) => (
        league.id === order.leagueId ? { ...league, bankroll: order.leagueBankroll } : league
      )));
      window.dispatchEvent(new Event(ORDER_PLACED_EVENT));
      setSheetState("success");
      setTimeout(() => {
        setSheetState("input");
        onClose();
      }, 1800);
    } catch (error) {
      setOrderError(error instanceof LeagueMembershipRequiredError
        ? t("shared.chooseLeagueOrder")
        : t("shared.orderFailed"));
      setSheetState("input");
    }
  }

  function handleClose() {
    setSheetState("input");
    setOrderError(null);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose} />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-6 pb-10"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="mx-auto flex max-w-sm flex-col gap-5">
              <AnimatePresence mode="wait">
                {sheetState === "success" ? (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 py-8">
                    <span className="text-5xl font-black" style={{ color: sideColor }}>OK</span>
                    <p className="text-base font-bold text-[var(--color-card-text)]">{t("shared.orderPlaced")}</p>
                    <p className="text-center text-sm text-[var(--color-card-muted)]">
                      {contracts.toFixed(1)} {side.toUpperCase()} contracts in{" "}
                      <span className="font-semibold text-[var(--color-card-text)]">{selectedLeague?.name}</span>
                    </p>
                  </motion.div>
                ) : (
                  <motion.div key="form" className="flex flex-col gap-4">
                    {orderError && (
                      <div className="rounded-xl border border-[var(--color-brand-primary)]/40 bg-[var(--color-brand-primary)]/10 px-4 py-3">
                        <p className="text-sm font-black text-[var(--color-card-text)]">{t("shared.leagueRequired")}</p>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--color-card-muted)]">{orderError}</p>
                      </div>
                    )}

                    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("shared.positionLeague")}</label>
                      {leagueOptions.length > 0 ? (
                        <select
                          value={selectedLeagueId}
                          onChange={(event) => setSelectedLeagueId(event.target.value)}
                          className="mt-2 w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-surface)] px-3 py-2 text-sm font-bold text-[var(--color-card-text)] outline-none focus:border-[var(--color-card-accent)]"
                        >
                          {leagueOptions.map((league) => (
                            <option key={league.id} value={league.id}>
                              {league.name} - ${league.bankroll.toLocaleString()}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="mt-2 text-xs text-[var(--color-card-muted)]">{t("shared.joinLeagueBeforePosition")}</p>
                      )}
                      <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                        <span className="truncate text-[var(--color-card-muted)]">{selectedLeague?.meta ?? t("shared.noLeagueSelected")}</span>
                        <span className={`font-bold ${selectedLeague && dollarAmount > bankroll ? "text-[var(--color-card-no)]" : "text-[var(--color-card-text)]"}`}>
                          ${selectedLeague ? bankroll.toLocaleString() : STARTING_BANKROLL.toLocaleString()}
                          {selectedLeague && dollarAmount > bankroll && ` - ${t("shared.insufficient")}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start justify-between">
                      <div className="mr-3 flex min-w-0 flex-col gap-0.5">
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: sideColor }}>
                          {side.toUpperCase()} - {priceCents}c
                        </span>
                        <p className="text-sm font-bold leading-snug text-[var(--color-card-text)]">{market.title}</p>
                      </div>
                      <button onClick={handleClose} className="shrink-0 text-xl leading-none text-[var(--color-card-muted)] transition-colors hover:text-[var(--color-card-text)]" aria-label={t("shared.close")}>x</button>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[var(--color-card-muted)]">{t("shared.amount")}</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--color-card-muted)]">$</span>
                        <input
                          type="number"
                          min="1"
                          max={bankroll}
                          step="1"
                          value={amount}
                          onChange={(event) => setAmount(event.target.value)}
                          className="w-full rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] py-3 pl-7 pr-4 text-base font-semibold text-[var(--color-card-text)] focus:border-[var(--color-card-accent)] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--color-card-muted)]">{t("profile.contracts")}</span>
                        <span className="font-semibold text-[var(--color-card-text)]">{dollarAmount > 0 ? contracts.toFixed(1) : "-"}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--color-card-muted)]">{t("shared.pricePerContract")}</span>
                        <span className="font-semibold text-[var(--color-card-text)]">{priceCents}c</span>
                      </div>
                      <div className="h-px bg-[var(--color-card-border)]" />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--color-card-muted)]">{t("shared.ifSideWins", { side: side.toUpperCase() })}</span>
                        <span className="font-bold" style={{ color: sideColor }}>{dollarAmount > 0 ? `$${payout.toFixed(2)}` : "-"}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleConfirm}
                      disabled={sheetState === "confirming" || !selectedLeague || dollarAmount <= 0 || dollarAmount > bankroll}
                      className="w-full rounded-xl py-3.5 text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50"
                      style={{ backgroundColor: sideDimColor, color: sideColor, border: `1px solid color-mix(in srgb, ${sideColor} 30%, transparent)` }}
                    >
                      {sheetState === "confirming"
                        ? t("shared.placing")
                        : t("shared.buyOrder", { contracts: contracts > 0 ? contracts.toFixed(1) : "0", side: side.toUpperCase(), league: selectedLeague?.name ?? t("shared.aLeague"), amount: dollarAmount > 0 ? String(dollarAmount) : "0" })}
                    </button>

                    <p className="text-center text-[10px] text-[var(--color-card-muted)]">{t("shared.noRealFunds")}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
