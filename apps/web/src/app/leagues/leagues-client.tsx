"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { LeagueMembership, SportLeague } from "@thecard/types";
import { EmailVerificationNotice } from "@/components/email-verification-notice";
import { SignInSheet } from "@/components/sign-in-sheet";
import { useAuth } from "@/contexts/auth-context";
import {
  formatLeagueDateRange,
  getLeagueStatus,
  getLeaguesByGroup,
  leagueTypeBadge,
} from "@/lib/sport-leagues";
import {
  LEAGUE_BANKROLL_EVENT,
  STARTING_BANKROLL,
  getUserLeagueMemberships,
  joinUserLeague,
} from "@/lib/league-store";

type MembershipMap = Record<string, LeagueMembership>;

function toMembershipMap(memberships: LeagueMembership[]): MembershipMap {
  return Object.fromEntries(memberships.map((membership) => [membership.leagueId, membership]));
}

function StatusPill({ status }: { status: "upcoming" | "active" | "closed" }) {
  if (status === "active") return <span className="text-[var(--color-card-yes)] font-semibold">Active</span>;
  if (status === "upcoming") return <span className="text-[var(--color-text-muted)]">Upcoming</span>;
  return <span className="text-[var(--color-card-no)]">Closed</span>;
}

function BankrollSummary({ membership }: { membership: LeagueMembership }) {
  const pnl = membership.currentBankroll - STARTING_BANKROLL;
  const pnlColor = pnl >= 0 ? "var(--color-card-yes)" : "var(--color-card-no)";
  const pnlSign = pnl >= 0 ? "+" : "";

  return (
    <div className="flex flex-col items-end shrink-0">
      <span className="text-sm font-black text-[var(--color-card-text)]">
        ${membership.currentBankroll.toLocaleString()}
      </span>
      {pnl !== 0 && (
        <span className="text-[10px] font-semibold" style={{ color: pnlColor }}>
          {pnlSign}${Math.abs(pnl).toLocaleString()}
        </span>
      )}
    </div>
  );
}

function YourLeagues({ memberships }: { memberships: MembershipMap }) {
  const joined = useMemo(
    () => getLeaguesByGroup().flatMap((group) => group.leagues).filter((league) => memberships[league.id]),
    [memberships],
  );

  if (joined.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest mb-3">
        Your Leagues
      </h2>
      <div className="flex flex-col gap-2">
        {joined.map((league) => {
          const membership = memberships[league.id]!;
          const status = getLeagueStatus(league);
          return (
            <div key={league.id} className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="text-sm font-bold text-[var(--color-card-text)] truncate">{league.name}</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">
                  {leagueTypeBadge(league.type, league.half)}
                  {" - "}
                  <StatusPill status={status} />
                </p>
              </div>
              <BankrollSummary membership={membership} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeagueRow({
  league,
  membership,
  joining,
  onJoin,
}: {
  league: SportLeague;
  membership: LeagueMembership | undefined;
  joining: boolean;
  onJoin: (leagueId: string) => void;
}) {
  const status = getLeagueStatus(league);
  const badge = leagueTypeBadge(league.type, league.half);
  const badgeColor =
    league.type === "sport_playoffs" || league.type === "sport_tournament"
      ? "var(--color-card-yes)"
      : league.type === "sport_half_season"
      ? "#f59e0b"
      : "var(--color-brand-primary)";

  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-bold text-[var(--color-card-text)] truncate">{league.name}</p>
          <span
            className="text-[9px] font-black uppercase tracking-wider shrink-0 px-1.5 py-0.5 rounded-full"
            style={{ color: badgeColor, backgroundColor: `color-mix(in srgb, ${badgeColor} 15%, transparent)` }}
          >
            {badge}
          </span>
        </div>
        <p className="text-[10px] text-[var(--color-text-muted)]">
          {formatLeagueDateRange(league)}
          {" - "}
          {league.memberCount.toLocaleString()} players
        </p>
      </div>

      {membership ? (
        <div className="flex flex-col items-end shrink-0">
          <span className="text-xs font-black text-[var(--color-card-text)]">
            ${membership.currentBankroll.toLocaleString()}
          </span>
          <span className="text-[9px] text-[var(--color-card-yes)] font-semibold">Joined</span>
        </div>
      ) : status === "closed" ? (
        <span className="text-[10px] text-[var(--color-text-muted)] shrink-0">Closed</span>
      ) : (
        <button
          onClick={() => onJoin(league.id)}
          disabled={joining}
          className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-brand-primary) 15%, transparent)",
            color: "var(--color-brand-primary)",
            border: "1px solid color-mix(in srgb, var(--color-brand-primary) 30%, transparent)",
          }}
        >
          {joining ? "Joining..." : "Join - Free"}
        </button>
      )}
    </div>
  );
}

function SportGroupSection({
  group,
  memberships,
  joiningLeagueId,
  onJoin,
}: {
  group: ReturnType<typeof getLeaguesByGroup>[number];
  memberships: MembershipMap;
  joiningLeagueId: string | null;
  onJoin: (leagueId: string) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between mb-3"
      >
        <h2 className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest flex items-center gap-1.5">
          <span>{group.label}</span>
        </h2>
        <span className="text-xs text-[var(--color-text-muted)]">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] divide-y divide-[var(--color-card-border)]">
          {group.leagues.map((league) => (
            <LeagueRow
              key={league.id}
              league={league}
              membership={memberships[league.id]}
              joining={joiningLeagueId === league.id}
              onJoin={onJoin}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function LeaguesClient() {
  const { user, verificationRequired } = useAuth();
  const groups = getLeaguesByGroup();
  const [memberships, setMemberships] = useState<MembershipMap>({});
  const [loading, setLoading] = useState(false);
  const [joiningLeagueId, setJoiningLeagueId] = useState<string | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!user || verificationRequired) {
      setMemberships({});
      return;
    }
    setLoading(true);
    getUserLeagueMemberships(user.uid)
      .then((next) => setMemberships(toMembershipMap(next)))
      .catch(() => setError("Could not load your leagues."))
      .finally(() => setLoading(false));
  }, [user, verificationRequired]);

  useEffect(() => {
    refresh();
    window.addEventListener(LEAGUE_BANKROLL_EVENT, refresh);
    return () => window.removeEventListener(LEAGUE_BANKROLL_EVENT, refresh);
  }, [refresh]);

  async function handleJoin(leagueId: string) {
    if (!user) {
      setSignInOpen(true);
      return;
    }
    if (verificationRequired || joiningLeagueId) return;
    setJoiningLeagueId(leagueId);
    setError(null);
    try {
      const membership = await joinUserLeague(user.uid, leagueId);
      setMemberships((current) => ({ ...current, [leagueId]: membership }));
    } catch {
      setError("Could not join that league. Try again.");
    } finally {
      setJoiningLeagueId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] pt-8 pb-32">
      <div className="max-w-lg mx-auto px-4">
        <div className="mb-8">
          <Link href="/card" className="text-sm text-[var(--color-brand-primary)] hover:underline mb-4 inline-block">
            Back
          </Link>
          <h1 className="text-4xl font-display font-black mb-2">Leagues</h1>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            Each league is its own $1,000 bankroll. Join as many as you want. Bets on matching markets count toward every active league you&apos;re in.
          </p>
        </div>

        {!user && (
          <div className="mb-6 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 text-center">
            <p className="text-sm font-bold text-[var(--color-card-text)]">Sign in to join leagues</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">League bankrolls sync to your account.</p>
            <button onClick={() => setSignInOpen(true)} className="mt-3 rounded-lg bg-[var(--color-brand-primary)] px-4 py-2 text-xs font-bold text-white">
              Sign in
            </button>
          </div>
        )}

        {user && verificationRequired && (
          <div className="mb-6">
            <EmailVerificationNotice compact />
          </div>
        )}

        {error && <p className="mb-4 rounded-lg border border-[var(--color-danger)]/30 px-3 py-2 text-xs text-[var(--color-danger)]">{error}</p>}
        {loading && <p className="mb-4 text-xs text-[var(--color-text-muted)]">Loading your leagues...</p>}

        <YourLeagues memberships={memberships} />

        <h2 className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest mb-5">
          Browse All Leagues
        </h2>

        {groups.map((group) => (
          <SportGroupSection
            key={group.sport}
            group={group}
            memberships={memberships}
            joiningLeagueId={joiningLeagueId}
            onJoin={handleJoin}
          />
        ))}

        <div className="border-t border-[var(--color-card-border)] pt-6 pb-4 text-center">
          <p className="text-xs text-[var(--color-text-muted)]">
            All leagues are free to join. Each starts you with $1,000 in practice money.
          </p>
        </div>
      </div>
      <SignInSheet open={signInOpen} onClose={() => setSignInOpen(false)} />
    </div>
  );
}
