import type { LeagueMembership } from "@thecard/types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { isFriendLeagueId } from "./league-store";
import { GLOBAL_LEAGUE } from "./season-store";
import { getLeagueStatus, getSportLeagueById, sportLeagueIdFromPaidLeagueId } from "./sport-leagues";

export type AccountPlan = "free" | "paid";

export interface AccountAccess {
  plan: AccountPlan;
  extraPaidSlots: number;
  freeLeagueSlots: number;
  friendLeagueSlots: number;
  paidLeagueSlots: number;
}

export interface LeagueAccessUsage {
  freeLeagues: number;
  friendLeagues: number;
  paidLeagues: number;
}

export interface LeagueAccessSnapshot {
  access: AccountAccess;
  usage: LeagueAccessUsage;
  remainingFreeLeagues: number;
  remainingFriendLeagues: number;
  remainingPaidLeagues: number;
}

const FREE_ACCESS: AccountAccess = {
  plan: "free",
  extraPaidSlots: 0,
  freeLeagueSlots: 2,
  friendLeagueSlots: 1,
  paidLeagueSlots: 0,
};

export function buildAccountAccess(plan: AccountPlan, extraPaidSlots = 0): AccountAccess {
  const normalizedExtraSlots = Math.max(0, Math.floor(extraPaidSlots));
  if (plan === "paid") {
    return {
      plan,
      extraPaidSlots: normalizedExtraSlots,
      freeLeagueSlots: 5 + normalizedExtraSlots * 2,
      friendLeagueSlots: 3,
      paidLeagueSlots: 3 + normalizedExtraSlots,
    };
  }
  return FREE_ACCESS;
}

export async function getUserAccountAccess(uid: string): Promise<AccountAccess> {
  if (!db) return FREE_ACCESS;
  const snap = await getDoc(doc(db, "users", uid));
  const data = snap.data();
  const rawPlan = (data?.accountPlan ?? data?.plan ?? data?.subscriptionTier) as string | undefined;
  const plan: AccountPlan = rawPlan === "paid" || rawPlan === "pro" || rawPlan === "member" ? "paid" : "free";
  const extraPaidSlots = (data?.extraPaidSlots as number | undefined) ?? 0;
  return buildAccountAccess(plan, extraPaidSlots);
}

function isActiveFreeMembership(membership: LeagueMembership): boolean {
  if (isFriendLeagueId(membership.leagueId)) return true;
  const sportLeague = getSportLeagueById(membership.leagueId);
  if (!sportLeague) return true;
  return getLeagueStatus(sportLeague) !== "closed";
}

function isActivePaidMembership(membership: LeagueMembership): boolean {
  if (membership.leagueId === GLOBAL_LEAGUE.id) return false;
  const sportLeagueId = sportLeagueIdFromPaidLeagueId(membership.leagueId);
  const sportLeague = sportLeagueId ? getSportLeagueById(sportLeagueId) : null;
  if (!sportLeague) return true;
  return getLeagueStatus(sportLeague) !== "closed";
}

export function calculateLeagueAccessUsage({
  freeMemberships,
  paidMemberships,
}: {
  freeMemberships: LeagueMembership[];
  paidMemberships: LeagueMembership[];
}): LeagueAccessUsage {
  const activeFreeMemberships = freeMemberships.filter(isActiveFreeMembership);
  return {
    freeLeagues: activeFreeMemberships.length,
    friendLeagues: activeFreeMemberships.filter((membership) => isFriendLeagueId(membership.leagueId)).length,
    paidLeagues: paidMemberships.filter(isActivePaidMembership).length,
  };
}

export function buildLeagueAccessSnapshot(
  access: AccountAccess,
  usage: LeagueAccessUsage
): LeagueAccessSnapshot {
  return {
    access,
    usage,
    remainingFreeLeagues: Math.max(0, access.freeLeagueSlots - usage.freeLeagues),
    remainingFriendLeagues: Math.max(0, access.friendLeagueSlots - usage.friendLeagues),
    remainingPaidLeagues: Math.max(0, access.paidLeagueSlots - usage.paidLeagues),
  };
}
