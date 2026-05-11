import type { Market } from "@thecard/types";
import { exchange } from "./exchange";
import {
  getUserLeagueMembership,
  getUserLeagueMemberships,
  isFriendLeagueId,
  placeUserLeagueBet,
  recordUserLeaguePayout,
  refundUserLeagueBet,
} from "./league-store";
import {
  GLOBAL_LEAGUE,
  getUserSeasonMemberships,
  placeUserSeasonBet,
  recordUserSeasonPayout,
  refundUserSeasonBet,
} from "./season-store";
import { getLeagueStatus, getSportLeagueById, isFreePrizeLeague, sportLeagueIdFromPaidLeagueId } from "./sport-leagues";
import { closeMatchingPositions, saveBetRecord, savePosition } from "./user-store";

export class LeagueMembershipRequiredError extends Error {
  constructor() {
    super("Choose a league before taking a position");
    this.name = "LeagueMembershipRequiredError";
  }
}

export interface AccountOrderResult {
  marketId: string;
  side: "yes" | "no";
  amountUsd: number;
  contracts: number;
  averagePrice: number;
  seasonBankroll: number;
  leagueId: string;
  leagueBankroll: number;
}

export async function placeAccountOrder({
  uid,
  market,
  side,
  amountUsd,
  leagueId,
}: {
  uid: string;
  market: Pick<Market, "id" | "sport" | "title">;
  side: "yes" | "no";
  amountUsd: number;
  leagueId: string;
}): Promise<AccountOrderResult> {
  if (!leagueId) throw new LeagueMembershipRequiredError();

  const seasonMemberships = await getUserSeasonMemberships(uid);
  const selectedSeasonMembership = seasonMemberships.find((membership) => membership.leagueId === leagueId);
  const isSeasonLeague = Boolean(selectedSeasonMembership);
  const joinedLeagues = await getUserLeagueMemberships(uid);
  const selectedFreeMembership = joinedLeagues.find((membership) => membership.leagueId === leagueId);
  const paidSportLeagueId = sportLeagueIdFromPaidLeagueId(leagueId);
  const paidSportLeague = paidSportLeagueId ? getSportLeagueById(paidSportLeagueId) : null;
  const freeSportLeague = selectedFreeMembership ? getSportLeagueById(selectedFreeMembership.leagueId) : null;

  if (!selectedSeasonMembership && !selectedFreeMembership) throw new LeagueMembershipRequiredError();
  if (selectedSeasonMembership && leagueId !== GLOBAL_LEAGUE.id && !paidSportLeague) {
    throw new LeagueMembershipRequiredError();
  }
  if (paidSportLeague && (isFreePrizeLeague(paidSportLeague) || paidSportLeague.sport !== market.sport || getLeagueStatus(paidSportLeague) === "closed")) {
    throw new LeagueMembershipRequiredError();
  }
  if (freeSportLeague && (freeSportLeague.sport !== market.sport || getLeagueStatus(freeSportLeague) === "closed")) {
    throw new LeagueMembershipRequiredError();
  }
  if (selectedFreeMembership && !freeSportLeague && !isFriendLeagueId(selectedFreeMembership.leagueId)) {
    throw new LeagueMembershipRequiredError();
  }

  const debitedMembership = isSeasonLeague
    ? await placeUserSeasonBet(uid, amountUsd, leagueId)
    : (await placeUserLeagueBet(uid, leagueId, amountUsd))
      ? await getUserLeagueMembership(uid, leagueId)
      : null;
  if (!debitedMembership) throw new Error("Insufficient bankroll");

  try {
    const fill = await exchange.placeOrder(uid, {
      marketId: market.id,
      side,
      amountUsd,
    });

    const position = {
      marketId: fill.marketId,
      marketTitle: market.title,
      sport: market.sport,
      side: fill.side,
      amountUsd: fill.filledAmountUsd,
      contracts: fill.filledAmountUsd / fill.price,
      averagePrice: fill.price,
      leagueId,
      leagueIds: [leagueId],
    };
    await saveBetRecord(uid, {
      leagueId,
      marketId: position.marketId,
      marketTitle: position.marketTitle,
      sport: position.sport,
      side: position.side,
      amountUsd: position.amountUsd,
      contracts: position.contracts,
      averagePrice: position.averagePrice,
    });
    await savePosition(uid, position);

    return {
      ...position,
      seasonBankroll: isSeasonLeague
        ? debitedMembership.currentBankroll
        : seasonMemberships.find((membership) => membership.leagueId === GLOBAL_LEAGUE.id)?.currentBankroll ?? 0,
      leagueBankroll: debitedMembership.currentBankroll,
    };
  } catch (error) {
    await (isSeasonLeague ? refundUserSeasonBet(uid, amountUsd, leagueId) : refundUserLeagueBet(uid, leagueId, amountUsd));
    throw error;
  }
}

export async function closeAccountPosition({
  uid,
  market,
  side,
  currentValue,
  leagueId,
}: {
  uid: string;
  market: Pick<Market, "id" | "sport" | "title">;
  side: "yes" | "no";
  currentValue: number;
  leagueId: string;
}): Promise<void> {
  if (leagueId === GLOBAL_LEAGUE.id || sportLeagueIdFromPaidLeagueId(leagueId)) {
    await recordUserSeasonPayout(uid, currentValue, leagueId);
  } else {
    await recordUserLeaguePayout(uid, leagueId, currentValue);
  }

  await closeMatchingPositions(uid, market.id, side, {
    marketTitle: market.title,
    sport: market.sport,
    payout: currentValue,
    outcome: "sold",
    leagueId,
  });
}
