import type { Market } from "@thecard/types";
import { exchange } from "./exchange";
import {
  getUserLeagueMembership,
  getUserLeagueMemberships,
  placeUserLeagueBet,
  recordUserLeaguePayout,
  refundUserLeagueBet,
} from "./league-store";
import {
  GLOBAL_LEAGUE,
  getExistingUserSeasonMembership,
  placeUserSeasonBet,
  recordUserSeasonPayout,
  refundUserSeasonBet,
} from "./season-store";
import { closeMatchingPositions, savePosition } from "./user-store";

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

  const isSeasonLeague = leagueId === GLOBAL_LEAGUE.id;
  const existingSeasonMembership = await getExistingUserSeasonMembership(uid);
  const joinedLeagues = await getUserLeagueMemberships(uid);
  const selectedFreeMembership = joinedLeagues.find((membership) => membership.leagueId === leagueId);

  if (isSeasonLeague && !existingSeasonMembership) throw new LeagueMembershipRequiredError();
  if (!isSeasonLeague && !selectedFreeMembership) throw new LeagueMembershipRequiredError();

  const debitedMembership = isSeasonLeague
    ? await placeUserSeasonBet(uid, amountUsd)
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
    await savePosition(uid, position);

    return {
      ...position,
      seasonBankroll: isSeasonLeague ? debitedMembership.currentBankroll : existingSeasonMembership?.currentBankroll ?? 0,
      leagueBankroll: debitedMembership.currentBankroll,
    };
  } catch (error) {
    await (isSeasonLeague ? refundUserSeasonBet(uid, amountUsd) : refundUserLeagueBet(uid, leagueId, amountUsd));
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
  if (leagueId === GLOBAL_LEAGUE.id) {
    await recordUserSeasonPayout(uid, currentValue);
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
