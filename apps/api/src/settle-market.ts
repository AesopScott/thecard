import { readFileSync } from "node:fs";
import { Buffer } from "node:buffer";
import { applicationDefault, cert, getApps, initializeApp, type AppOptions, type ServiceAccount } from "firebase-admin/app";
import { FieldValue, getFirestore, type DocumentReference, type Firestore } from "firebase-admin/firestore";
import type { Sport } from "@thecard/types";

type Outcome = "yes" | "no";

interface Args {
  marketId: string;
  sport: Sport;
  outcome: Outcome;
  commit: boolean;
  force: boolean;
}

interface UserSettlement {
  uid: string;
  forecastResolved: boolean;
  positionsClosed: number;
  payout: number;
  seasonMembershipsCredited: number;
  leagueMembershipsCredited: number;
}

const SPORTS = new Set<Sport>(["nfl", "nba", "mlb", "nhl", "ufc", "ncaaf", "ncaab", "soccer", "other"]);

let db: Firestore;

try {
  await main();
} catch (error) {
  console.error(formatError(error));
  process.exit(1);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  initFirebase();
  db = getFirestore();

  const usersSnap = await db.collection("users").get();
  const results: UserSettlement[] = [];

  for (const userDoc of usersSnap.docs) {
    const result = await settleUser(userDoc.ref, args);
    if (result.forecastResolved || result.positionsClosed > 0 || result.payout > 0) {
      results.push(result);
    }
  }

  const totals = results.reduce(
    (acc, result) => ({
      usersTouched: acc.usersTouched + 1,
      forecastsResolved: acc.forecastsResolved + (result.forecastResolved ? 1 : 0),
      positionsClosed: acc.positionsClosed + result.positionsClosed,
      payout: acc.payout + result.payout,
      seasonMembershipsCredited: acc.seasonMembershipsCredited + result.seasonMembershipsCredited,
      leagueMembershipsCredited: acc.leagueMembershipsCredited + result.leagueMembershipsCredited,
    }),
    {
      usersTouched: 0,
      forecastsResolved: 0,
      positionsClosed: 0,
      payout: 0,
      seasonMembershipsCredited: 0,
      leagueMembershipsCredited: 0,
    },
  );

  console.log(JSON.stringify({
    mode: args.commit ? "commit" : "dry-run",
    marketId: args.marketId,
    sport: args.sport,
    outcome: args.outcome,
    force: args.force,
    totals,
    users: results,
  }, null, 2));
}

async function settleUser(userRef: DocumentReference, input: Args): Promise<UserSettlement> {
  const forecastRef = userRef.collection("forecasts").doc(input.marketId);
  const forecastSnap = await forecastRef.get();
  const positionsSnap = await userRef.collection("positions").where("marketId", "==", input.marketId).get();

  let forecastResolved = false;
  const writes = db.batch();

  if (forecastSnap.exists) {
    const forecast = forecastSnap.data() ?? {};
    const existingOutcome = forecast.outcome as Outcome | null | undefined;
    if (input.force || existingOutcome == null) {
      const probability = Number(forecast.probability ?? 0.5);
      const thisBrierScore = Math.pow(probability - (input.outcome === "yes" ? 1 : 0), 2);
      writes.set(forecastRef, {
        outcome: input.outcome,
        brierScore: thisBrierScore,
        settledAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      const stats = await computeStatsAfterSettlement(userRef, input.marketId, input.outcome);
      writes.set(userRef, {
        calibrationScore: stats.calibrationScore,
        resolvedCount: stats.resolvedCount,
        avgBrierScore: stats.avgBrierScore,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      forecastResolved = true;
    }
  }

  let payout = 0;
  const leagueIds = new Set<string>();
  positionsSnap.docs.forEach((positionDoc) => {
    const position = positionDoc.data();
    const contracts = Number(position.contracts ?? 0);
    const averagePrice = Number(position.averagePrice ?? 0);
    const costBasis = Number(position.amountUsd ?? contracts * averagePrice);
    const positionPayout = position.side === input.outcome ? contracts : 0;
    if (position.side === input.outcome) {
      payout += contracts;
      const positionLeagueIds = Array.isArray(position.leagueIds) ? position.leagueIds as string[] : [];
      positionLeagueIds.forEach((leagueId) => leagueIds.add(leagueId));
    }
    writes.set(userRef.collection("settledPositions").doc(), {
      marketId: input.marketId,
      marketTitle: (position.marketTitle as string | undefined) ?? input.marketId,
      sport: (position.sport as Sport | undefined) ?? input.sport,
      side: position.side,
      contracts,
      averagePrice,
      costBasis,
      payout: positionPayout,
      pnl: positionPayout - costBasis,
      outcome: input.outcome,
      closedAtMs: Date.now(),
      closedAt: FieldValue.serverTimestamp(),
    });
    writes.delete(positionDoc.ref);
  });

  let seasonMembershipsCredited = 0;
  let leagueMembershipsCredited = 0;

  if (payout > 0) {
    const seasonMembershipsSnap = await userRef.collection("seasonMemberships").get();
    seasonMembershipsSnap.docs.forEach((membershipDoc) => {
      writes.set(membershipDoc.ref, {
        currentBankroll: FieldValue.increment(payout),
        isBust: false,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      seasonMembershipsCredited += 1;
    });

    if (leagueIds.size === 0) {
      const leagueMembershipsSnap = await userRef.collection("leagueMemberships").get();
      leagueMembershipsSnap.docs
        .filter((membershipDoc) => input.sport === "other" || membershipDoc.id.startsWith(`${input.sport}-`))
        .forEach((membershipDoc) => leagueIds.add(membershipDoc.id));
    }

    Array.from(leagueIds).forEach((leagueId) => {
      writes.set(userRef.collection("leagueMemberships").doc(leagueId), {
        currentBankroll: FieldValue.increment(payout),
        isBust: false,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      leagueMembershipsCredited += 1;
    });
  }

  if (input.commit && (forecastResolved || !positionsSnap.empty || payout > 0)) {
    await writes.commit();
  }

  return {
    uid: userRef.id,
    forecastResolved,
    positionsClosed: positionsSnap.size,
    payout,
    seasonMembershipsCredited,
    leagueMembershipsCredited,
  };
}

async function computeStatsAfterSettlement(
  userRef: DocumentReference,
  marketId: string,
  outcome: Outcome,
): Promise<{ calibrationScore: number; resolvedCount: number; avgBrierScore: number }> {
  const forecastsSnap = await userRef.collection("forecasts").get();
  const resolved = forecastsSnap.docs
    .map((forecastDoc) => {
      const forecast = forecastDoc.data();
      const nextOutcome = forecastDoc.id === marketId ? outcome : forecast.outcome as Outcome | null | undefined;
      if (nextOutcome == null) return null;
      return {
        probability: Number(forecast.probability ?? 0.5),
        outcome: (nextOutcome === "yes" ? 1 : 0) as 0 | 1,
      };
    })
    .filter((forecast): forecast is { probability: number; outcome: 0 | 1 } => forecast !== null);

  const avgBrierScore = brierScore(resolved);
  return {
    calibrationScore: calibrationScore(avgBrierScore),
    resolvedCount: resolved.length,
    avgBrierScore,
  };
}

function brierScore(predictions: ReadonlyArray<{ probability: number; outcome: 0 | 1 }>): number {
  if (predictions.length === 0) return 0;
  const sum = predictions.reduce((acc, prediction) => (
    acc + Math.pow(prediction.probability - prediction.outcome, 2)
  ), 0);
  return sum / predictions.length;
}

function calibrationScore(brierScoreValue: number): number {
  const raw = (1 - brierScoreValue / 0.25) * 100;
  return Math.max(0, Math.round(raw));
}

function initFirebase(): void {
  if (getApps().length > 0) return;
  const projectId = process.env.FIREBASE_PROJECT_ID
    ?? process.env.GOOGLE_CLOUD_PROJECT
    ?? readDefaultProjectId();

  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountBase64 || serviceAccountJson) {
    const raw = serviceAccountBase64
      ? Buffer.from(serviceAccountBase64, "base64").toString("utf8")
      : serviceAccountJson!;
    const parsed = JSON.parse(raw) as ServiceAccount & { private_key?: string };
    if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    initializeApp(withProjectId({ credential: cert(parsed) }, projectId));
    return;
  }

  initializeApp(withProjectId({ credential: applicationDefault() }, projectId));
}

function withProjectId(options: AppOptions, projectId: string | undefined): AppOptions {
  return projectId ? { ...options, projectId } : options;
}

function readDefaultProjectId(): string | undefined {
  try {
    const firebaseRc = JSON.parse(readFileSync(new URL("../../../.firebaserc", import.meta.url), "utf8")) as {
      projects?: { default?: string };
    };
    return firebaseRc.projects?.default;
  } catch {
    return undefined;
  }
}

function parseArgs(argv: string[]): Args {
  const values = new Map<string, string | boolean>();
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!;
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      values.set(key, true);
    } else {
      values.set(key, next);
      i += 1;
    }
  }

  const marketId = stringArg(values, "market");
  const sport = stringArg(values, "sport") as Sport;
  const outcome = stringArg(values, "outcome") as Outcome;

  if (!marketId) fail("Missing --market <marketId>");
  if (!SPORTS.has(sport)) fail(`Invalid --sport ${sport}`);
  if (outcome !== "yes" && outcome !== "no") fail("Outcome must be yes or no");

  return {
    marketId,
    sport,
    outcome,
    commit: values.has("commit"),
    force: values.has("force"),
  };
}

function stringArg(values: Map<string, string | boolean>, key: string): string {
  const value = values.get(key);
  return typeof value === "string" ? value : "";
}

function fail(message: string): never {
  console.error(`Error: ${message}`);
  console.error("Usage: pnpm --filter @thecard/api settle-market -- --market <id> --sport <sport> --outcome <yes|no> [--commit] [--force]");
  process.exit(1);
}

function formatError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Could not load the default credentials")) {
    return [
      "Error: Firebase Admin credentials are not configured.",
      "",
      "Set one of these before running settlement:",
      "- GOOGLE_APPLICATION_CREDENTIALS=<path-to-service-account.json>",
      "- FIREBASE_SERVICE_ACCOUNT_KEY=<raw service account JSON>",
      "- FIREBASE_SERVICE_ACCOUNT_BASE64=<base64 encoded service account JSON>",
      "",
      "Dry-run example:",
      "pnpm --filter @thecard/api settle-market -- --market m1 --sport nfl --outcome yes",
      "",
      "Commit example:",
      "pnpm --filter @thecard/api settle-market -- --market m1 --sport nfl --outcome yes --commit",
    ].join("\n");
  }
  return error instanceof Error && error.stack ? error.stack : `Error: ${message}`;
}
