import { collection, doc, getDocs, query, serverTimestamp, where, writeBatch } from "firebase/firestore";
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
  const firestore = db;

  const positionsSnap = await getDocs(query(
    collection(firestore, "users", uid, "positions"),
    where("marketId", "==", marketId),
  ));

  if (positionsSnap.empty) return { payout: 0, settledPositions: 0 };

  let payout = 0;
  const leagueIds = new Set<string>();
  positionsSnap.docs.forEach((positionDoc) => {
    const data = positionDoc.data();
    if (data.side === outcome) {
      payout += (data.contracts as number | undefined) ?? 0;
      ((data.leagueIds as string[] | undefined) ?? []).forEach((leagueId) => leagueIds.add(leagueId));
    }
  });

  if (payout > 0) {
    await recordUserSeasonPayout(uid, payout);
    const activeLeagueIds = leagueIds.size > 0
      ? Array.from(leagueIds)
      : await getActiveJoinedLeaguesForSportForUser(uid, sport);
    await Promise.all(
      activeLeagueIds.map((leagueId) => recordUserLeaguePayout(uid, leagueId, payout))
    );
  }

  const batch = writeBatch(firestore);
  const closedAtMs = Date.now();
  positionsSnap.docs.forEach((positionDoc) => {
    const data = positionDoc.data();
    const contracts = (data.contracts as number | undefined) ?? 0;
    const averagePrice = (data.averagePrice as number | undefined) ?? 0;
    const costBasis = (data.amountUsd as number | undefined) ?? contracts * averagePrice;
    const positionPayout = data.side === outcome ? contracts : 0;
    batch.set(doc(collection(firestore, "users", uid, "settledPositions")), {
      marketId,
      marketTitle: (data.marketTitle as string | undefined) ?? marketId,
      sport,
      side: data.side,
      contracts,
      averagePrice,
      costBasis,
      payout: positionPayout,
      pnl: positionPayout - costBasis,
      outcome,
      closedAtMs,
      closedAt: serverTimestamp(),
    });
    batch.delete(positionDoc.ref);
  });
  await batch.commit();

  return { payout, settledPositions: positionsSnap.size };
}
