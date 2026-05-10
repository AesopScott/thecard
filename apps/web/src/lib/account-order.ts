import type { Market } from "@thecard/types";
import { exchange } from "./exchange";
import {
  getActiveJoinedLeaguesForSportForUser,
  placeUserLeagueBet,
  recordUserLeaguePayout,
  refundUserLeagueBet,
} from "./league-store";
import { placeUserSeasonBet, recordUserSeasonPayout, refundUserSeasonBet } from "./season-store";
import { closePosition, savePosition } from "./user-store";

export interface AccountOrderResult {
  marketId: string;
  side: "yes" | "no";
  amountUsd: number;
  contracts: number;
  averagePrice: number;
  seasonBankroll: number;
}

export async function placeAccountOrder({
  uid,
  market,
  side,
  amountUsd,
}: {
  uid: string;
  market: Pick<Market, "id" | "sport">;
  side: "yes" | "no";
  amountUsd: number;
}): Promise<AccountOrderResult> {
  const seasonMembership = await placeUserSeasonBet(uid, amountUsd);
  if (!seasonMembership) throw new Error("Insufficient bankroll");

  const debitedLeagueIds: string[] = [];
  try {
    for (const leagueId of await getActiveJoinedLeaguesForSportForUser(uid, market.sport)) {
      const debited = await placeUserLeagueBet(uid, leagueId, amountUsd);
      if (!debited) throw new Error("Insufficient league bankroll");
      debitedLeagueIds.push(leagueId);
    }

    const fill = await exchange.placeOrder(uid, {
      marketId: market.id,
      side,
      amountUsd,
    });

    const position = {
      marketId: fill.marketId,
      side: fill.side,
      amountUsd: fill.filledAmountUsd,
      contracts: fill.filledAmountUsd / fill.price,
      averagePrice: fill.price,
    };
    await savePosition(uid, position);

    return {
      ...position,
      seasonBankroll: seasonMembership.currentBankroll,
    };
  } catch (error) {
    await Promise.allSettled([
      refundUserSeasonBet(uid, amountUsd),
      ...debitedLeagueIds.map((leagueId) => refundUserLeagueBet(uid, leagueId, amountUsd)),
    ]);
    throw error;
  }
}

export async function closeAccountPosition({
  uid,
  positionId,
  market,
  currentValue,
}: {
  uid: string;
  positionId: string;
  market: Pick<Market, "sport">;
  currentValue: number;
}): Promise<void> {
  await recordUserSeasonPayout(uid, currentValue);

  for (const leagueId of await getActiveJoinedLeaguesForSportForUser(uid, market.sport)) {
    await recordUserLeaguePayout(uid, leagueId, currentValue);
  }

  await closePosition(uid, positionId);
}
