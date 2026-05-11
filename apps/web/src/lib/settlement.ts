import { collection, doc, getDocs, query, serverTimestamp, where, writeBatch } from "firebase/firestore";
import type { Sport } from "@thecard/types";
import { db } from "./firebase";
import { resolveForecast } from "./forecast-store";
import { recordUserLeaguePayout } from "./league-store";
import { GLOBAL_LEAGUE, recordUserSeasonPayout } from "./season-store";
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
  const payoutsByLeague = new Map<string, number>();
  positionsSnap.docs.forEach((positionDoc) => {
    const data = positionDoc.data();
    if (data.side === outcome) {
      const positionPayout = (data.contracts as number | undefined) ?? 0;
      payout += positionPayout;
      const leagueId = (data.leagueId as string | undefined) ?? ((data.leagueIds as string[] | undefined) ?? [])[0] ?? GLOBAL_LEAGUE.id;
      payoutsByLeague.set(leagueId, (payoutsByLeague.get(leagueId) ?? 0) + positionPayout);
    }
  });

  if (payout > 0) {
    await Promise.all(
      Array.from(payoutsByLeague.entries()).map(([leagueId, leaguePayout]) =>
        leagueId === GLOBAL_LEAGUE.id
          ? recordUserSeasonPayout(uid, leaguePayout)
          : recordUserLeaguePayout(uid, leagueId, leaguePayout)
      )
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
    const leagueId = (data.leagueId as string | undefined) ?? ((data.leagueIds as string[] | undefined) ?? [])[0];
    batch.set(doc(collection(firestore, "users", uid, "settledPositions")), {
      marketId,
      marketTitle: (data.marketTitle as string | undefined) ?? marketId,
      sport,
      leagueId,
      side: data.side,
      contracts,
      averagePrice,
      costBasis,
      payout: positionPayout,
      pnl: positionPayout - costBasis,
      outcome,
      openedAtMs: (data.openedAtMs as number | undefined) ?? closedAtMs,
      closedAtMs,
      closedAt: serverTimestamp(),
    });
    batch.delete(positionDoc.ref);
  });
  await batch.commit();

  return { payout, settledPositions: positionsSnap.size };
}
