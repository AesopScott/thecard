import { collection, getDocs, query, where, writeBatch } from "firebase/firestore";
import type { Sport } from "@thecard/types";
import { db } from "./firebase";
import { resolveForecast } from "./forecast-store";
import { getActiveJoinedLeaguesForSportForUser, recordUserLeaguePayout } from "./league-store";
import { recordUserSeasonPayout } from "./season-store";
import { resolveFirestoreForecast } from "./user-store";

export interface SettleUserMarketInput {
  uid: string;
  marketId: string;
  sport: Sport;
  outcome: "yes" | "no";
}

export interface SettlementResult {
  payout: number;
  settledPositions: number;
}

export async function settleUserMarket({
  uid,
  marketId,
  sport,
  outcome,
}: SettleUserMarketInput): Promise<SettlementResult> {
  resolveForecast(marketId, outcome);
  await resolveFirestoreForecast(uid, marketId, outcome);
  const result = await settleUserPositions({ uid, marketId, sport, outcome });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("thecard:order:placed"));
  }
  return result;
}

async function settleUserPositions({
  uid,
  marketId,
  sport,
  outcome,
}: SettleUserMarketInput): Promise<SettlementResult> {
  if (!db) return { payout: 0, settledPositions: 0 };

  const positionsSnap = await getDocs(query(
    collection(db, "users", uid, "positions"),
    where("marketId", "==", marketId),
  ));

  if (positionsSnap.empty) return { payout: 0, settledPositions: 0 };

  let payout = 0;
  positionsSnap.docs.forEach((positionDoc) => {
    const data = positionDoc.data();
    if (data.side === outcome) {
      payout += (data.contracts as number | undefined) ?? 0;
    }
  });

  if (payout > 0) {
    await recordUserSeasonPayout(uid, payout);
    const activeLeagueIds = await getActiveJoinedLeaguesForSportForUser(uid, sport);
    await Promise.all(
      activeLeagueIds.map((leagueId) => recordUserLeaguePayout(uid, leagueId, payout))
    );
  }

  const batch = writeBatch(db);
  positionsSnap.docs.forEach((positionDoc) => batch.delete(positionDoc.ref));
  await batch.commit();

  return { payout, settledPositions: positionsSnap.size };
}
