import type { Market } from "@thecard/types";
import { exchange } from "./exchange";
import { getActiveJoinedLeaguesForSportForUser, placeUserLeagueBet } from "./league-store";
import { placeUserSeasonBet } from "./season-store";
import { savePosition } from "./user-store";

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

  const fill = await exchange.placeOrder(uid, {
    marketId: market.id,
    side,
    amountUsd,
  });

  for (const leagueId of await getActiveJoinedLeaguesForSportForUser(uid, market.sport)) {
    await placeUserLeagueBet(uid, leagueId, amountUsd);
  }

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
}
