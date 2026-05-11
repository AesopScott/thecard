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
  createFriendLeagueNumber,
  friendLeagueNumberFromId,
  getUserLeagueMemberships,
  joinUserFriendLeague,
  joinUserLeague,
  subscribeFreeLeagueLeaderboard,
  type FreeLeagueLeaderboardEntry,
} from "@/lib/league-store";
import {
  ACTIVE_SEASON,
  GLOBAL_LEAGUE,
  SEASON_BANKROLL_EVENT,
  getExistingUserSeasonMembership,
  joinUserSeasonLeague,
} from "@/lib/season-store";

type MembershipMap = Record<string, LeagueMembership>;
type LeaderboardMap = Record<string, FreeLeagueLeaderboardEntry[]>;

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
  return (
    <div className="flex flex-col items-end shrink-0">
      <span className="text-sm font-black text-[var(--color-card-text)]">
        ${membership.currentBankroll.toLocaleString()}
      </span>
      <span className="text-[10px] font-semibold" style={{ color: pnlColor }}>
        {pnl >= 0 ? "+" : ""}${Math.abs(pnl).toLocaleString()}
      </span>
    </div>
  );
}

function CalendarTopCard({ mode }: { mode: "free" | "paid" }) {
  return (
    <Link
      href="/sports-calendar"
      className="block rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 transition-colors hover:border-[var(--color-brand-primary)]/50"
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Calendar</p>
      <p className="mt-1 text-sm font-black text-[var(--color-card-text)]">
        {mode === "free" ? "Find free leagues by schedule" : "Paid league calendar"}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">
        Start with the calendar, then jump into the league that matches the season, tournament, or event window.
      </p>
    </Link>
  );
}

function seededDelta(seed: string, index: number): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> (index % 16)) % 1300) - 450;
}

function buildFreeLeagueStandings(leagueId: string, membership: LeagueMembership): FreeLeagueLeaderboardEntry[] {
  const handles = ["SharpMike", "LineReader", "PropShop", "LateSteam", "ValueHunter", "PocketEdge"];
  const mocks = handles.map((displayName, index) => ({
    uid: `mock-${leagueId}-${index}`,
    username: displayName.toLowerCase(),
    displayName,
    photoURL: null,
    bankroll: STARTING_BANKROLL + seededDelta(`${leagueId}:${displayName}`, index),
    shadowWinnings: seededDelta(`${leagueId}:${displayName}`, index),
    betCount: 8 + Math.abs(seededDelta(`${displayName}:bets`, index)) % 31,
    joinedAtMs: Date.now() - index * 86_400_000,
  }));
  const you = {
    uid: "you",
    username: "you",
    displayName: "You",
    photoURL: null,
    bankroll: membership.currentBankroll,
    shadowWinnings: membership.currentBankroll - membership.startingBankroll,
    betCount: membership.betCount,
    joinedAtMs: membership.joinedAt,
    isYou: true,
  };
  return [...mocks, you]
    .sort((a, b) => b.bankroll - a.bankroll)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function FreeLeagueLeaderboard({
  leagueId,
  membership,
  entries,
}: {
  leagueId: string;
  membership: LeagueMembership;
  entries: FreeLeagueLeaderboardEntry[];
}) {
  const standings = entries.length > 0 ? entries : buildFreeLeagueStandings(leagueId, membership);
  return (
    <div className="mt-2 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">
          Free Board
        </p>
        <span className="rounded-full border border-[var(--color-card-border)] px-2 py-1 text-[10px] font-bold text-[var(--color-card-muted)]">
          No payouts
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {standings.slice(0, 5).map((entry) => {
          const pnl = entry.bankroll - STARTING_BANKROLL;
          return (
            <div
              key={`${entry.uid}-${entry.rank}`}
              className={`flex items-center justify-between rounded-md px-2 py-1.5 text-xs ${
                entry.isYou ? "bg-[var(--color-brand-dim)] text-[var(--color-card-text)]" : "text-[var(--color-card-muted)]"
              }`}
            >
              <span className="font-bold">#{entry.rank} {entry.displayName}</span>
              <span className={pnl >= 0 ? "text-[var(--color-card-yes)]" : "text-[var(--color-card-no)]"}>
                {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
              </span>
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

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          <p className="truncate text-sm font-bold text-[var(--color-card-text)]">{league.name}</p>
          <span className="shrink-0 rounded-full border border-[var(--color-card-border)] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[var(--color-brand-primary)]">
            {badge}
          </span>
        </div>
        <p className="text-[10px] text-[var(--color-text-muted)]">
          {formatLeagueDateRange(league)} - {league.memberCount.toLocaleString()} players
        </p>
      </div>

      {membership ? (
        <BankrollSummary membership={membership} />
      ) : status === "closed" ? (
        <span className="shrink-0 text-[10px] text-[var(--color-text-muted)]">Closed</span>
      ) : (
        <button
          onClick={() => onJoin(league.id)}
          disabled={joining}
          className="shrink-0 rounded-lg border border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/15 px-3 py-1.5 text-xs font-bold text-[var(--color-brand-primary)] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {joining ? "Joining..." : "Join Free"}
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
    <div>
      <button onClick={() => setOpen((o) => !o)} className="mb-3 flex w-full items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{group.label}</h3>
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

function FriendsLeagueBox({
  joining,
  onJoin,
}: {
  joining: boolean;
  onJoin: (number: string) => void;
}) {
  const [number, setNumber] = useState("");
  return (
    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Friends League</p>
      <p className="mt-1 text-sm font-black text-[var(--color-card-text)]">Join by number</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">
        Free, private-by-number leagues for friend groups. No prize payouts.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          value={number}
          onChange={(event) => setNumber(event.target.value)}
          inputMode="numeric"
          placeholder="123456"
          className="min-w-0 flex-1 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] px-3 py-2 text-sm font-bold text-[var(--color-card-text)] outline-none focus:border-[var(--color-brand-primary)]"
        />
        <button
          type="button"
          onClick={() => onJoin(number)}
          disabled={joining}
          className="rounded-lg bg-[var(--color-brand-primary)] px-3 py-2 text-xs font-black text-white disabled:opacity-60"
        >
          Join
        </button>
      </div>
      <button
        type="button"
        onClick={() => onJoin(createFriendLeagueNumber())}
        disabled={joining}
        className="mt-2 w-full rounded-lg border border-[var(--color-card-border)] px-3 py-2 text-xs font-black text-[var(--color-card-text)] disabled:opacity-60"
      >
        Create new number
      </button>
    </div>
  );
}

function PaidLeagueColumn({
  membership,
  joining,
  onJoin,
  groups,
}: {
  membership: LeagueMembership | null;
  joining: boolean;
  onJoin: () => void;
  groups: ReturnType<typeof getLeaguesByGroup>;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Paid Leagues</h2>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">Calendar first, then paid contests.</p>
      </div>
      <CalendarTopCard mode="paid" />
      <div className="rounded-xl border border-[var(--color-brand-primary)]/30 bg-[var(--color-card-surface)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-[var(--color-card-text)]">Global Season League</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              {ACTIVE_SEASON.name} - prize pool ${ACTIVE_SEASON.prizePoolEstimate.toLocaleString()}+
            </p>
          </div>
          {membership ? (
            <BankrollSummary membership={membership} />
          ) : (
            <button
              type="button"
              onClick={onJoin}
              disabled={joining}
              className="shrink-0 rounded-lg bg-[var(--color-brand-primary)] px-3 py-2 text-xs font-black text-white disabled:opacity-60"
            >
              {joining ? "Joining..." : "Join"}
            </button>
          )}
        </div>
      </div>
      {groups.map((group) => (
        <PaidSportGroupSection
          key={group.sport}
          group={group}
          membership={membership}
          joining={joining}
          onJoin={onJoin}
        />
      ))}
    </section>
  );
}

function PaidSportGroupSection({
  group,
  membership,
  joining,
  onJoin,
}: {
  group: ReturnType<typeof getLeaguesByGroup>[number];
  membership: LeagueMembership | null;
  joining: boolean;
  onJoin: () => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} className="mb-3 flex w-full items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{group.label}</h3>
        <span className="text-xs text-[var(--color-text-muted)]">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] divide-y divide-[var(--color-card-border)]">
          {group.leagues.map((league) => (
            <PaidLeagueRow
              key={league.id}
              league={league}
              membership={membership}
              joining={joining}
              onJoin={onJoin}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PaidLeagueRow({
  league,
  membership,
  joining,
  onJoin,
}: {
  league: SportLeague;
  membership: LeagueMembership | null;
  joining: boolean;
  onJoin: () => void;
}) {
  const status = getLeagueStatus(league);
  const badge = leagueTypeBadge(league.type, league.half);

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          <p className="truncate text-sm font-bold text-[var(--color-card-text)]">{league.name}</p>
          <span className="shrink-0 rounded-full border border-[var(--color-card-border)] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[var(--color-brand-primary)]">
            {badge}
          </span>
        </div>
        <p className="text-[10px] text-[var(--color-text-muted)]">
          {formatLeagueDateRange(league)} - prize eligible
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
        <span className="shrink-0 text-[10px] text-[var(--color-text-muted)]">Closed</span>
      ) : (
        <button
          type="button"
          onClick={onJoin}
          disabled={joining}
          className="shrink-0 rounded-lg bg-[var(--color-brand-primary)] px-3 py-1.5 text-xs font-black text-white disabled:opacity-60"
        >
          {joining ? "Joining..." : "Join Paid"}
        </button>
      )}
    </div>
  );
}

function leagueName(leagueId: string): string {
  const friendNumber = friendLeagueNumberFromId(leagueId);
  if (friendNumber) return `Friends League #${friendNumber}`;
  return getLeaguesByGroup().flatMap((group) => group.leagues).find((league) => league.id === leagueId)?.name ?? leagueId;
}

function YourLeagues({
  memberships,
  seasonMembership,
  leaderboards,
}: {
  memberships: MembershipMap;
  seasonMembership: LeagueMembership | null;
  leaderboards: LeaderboardMap;
}) {
  const joinedMemberships = useMemo(() => Object.values(memberships), [memberships]);
  const hasAny = joinedMemberships.length > 0 || Boolean(seasonMembership);

  return (
    <aside className="lg:sticky lg:top-6 lg:self-start">
      <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Your Leagues</h2>
      {!hasAny && (
        <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
          <p className="text-sm font-black text-[var(--color-card-text)]">No leagues yet</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">
            Join any free league, friends league, or paid league before taking a position.
          </p>
        </div>
      )}
      <div className="flex flex-col gap-3">
        {seasonMembership && (
          <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[var(--color-card-text)]">{GLOBAL_LEAGUE.name} League</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">Paid season league</p>
              </div>
              <BankrollSummary membership={seasonMembership} />
            </div>
          </div>
        )}
        {joinedMemberships.map((membership) => (
          <div key={membership.leagueId} className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[var(--color-card-text)]">{leagueName(membership.leagueId)}</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">
                  {friendLeagueNumberFromId(membership.leagueId) ? "Friends league - free, no payouts" : "Free league"}
                </p>
              </div>
              <BankrollSummary membership={membership} />
            </div>
            <FreeLeagueLeaderboard
              leagueId={membership.leagueId}
              membership={membership}
              entries={leaderboards[membership.leagueId] ?? []}
            />
          </div>
        ))}
      </div>
    </aside>
  );
}

export function LeaguesClient() {
  const { user, verificationRequired } = useAuth();
  const groups = getLeaguesByGroup();
  const [memberships, setMemberships] = useState<MembershipMap>({});
  const [seasonMembership, setSeasonMembership] = useState<LeagueMembership | null>(null);
  const [leaderboards, setLeaderboards] = useState<LeaderboardMap>({});
  const [loading, setLoading] = useState(false);
  const [joiningLeagueId, setJoiningLeagueId] = useState<string | null>(null);
  const [joiningSeason, setJoiningSeason] = useState(false);
  const [joiningFriend, setJoiningFriend] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!user || verificationRequired) {
      setMemberships({});
      setSeasonMembership(null);
      return;
    }
    setLoading(true);
    Promise.all([
      getUserLeagueMemberships(user.uid),
      getExistingUserSeasonMembership(user.uid),
    ])
      .then(([nextMemberships, nextSeasonMembership]) => {
        setMemberships(toMembershipMap(nextMemberships));
        setSeasonMembership(nextSeasonMembership);
      })
      .catch(() => setError("Could not load your leagues."))
      .finally(() => setLoading(false));
  }, [user, verificationRequired]);

  useEffect(() => {
    refresh();
    window.addEventListener(LEAGUE_BANKROLL_EVENT, refresh);
    window.addEventListener(SEASON_BANKROLL_EVENT, refresh);
    return () => {
      window.removeEventListener(LEAGUE_BANKROLL_EVENT, refresh);
      window.removeEventListener(SEASON_BANKROLL_EVENT, refresh);
    };
  }, [refresh]);

  useEffect(() => {
    if (!user || verificationRequired) {
      setLeaderboards({});
      return;
    }
    const leagueIds = Object.keys(memberships);
    if (leagueIds.length === 0) {
      setLeaderboards({});
      return;
    }
    const unsubs = leagueIds.map((leagueId) => subscribeFreeLeagueLeaderboard(
      leagueId,
      (entries) => setLeaderboards((current) => ({ ...current, [leagueId]: entries })),
      user.uid,
    ));
    return () => unsubs.forEach((unsub) => unsub());
  }, [memberships, user, verificationRequired]);

  function requireUser(): boolean {
    if (!user) {
      setSignInOpen(true);
      return false;
    }
    return !verificationRequired;
  }

  async function handleJoin(leagueId: string) {
    if (!requireUser() || !user || joiningLeagueId) return;
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

  async function handleJoinSeason() {
    if (!requireUser() || !user || joiningSeason) return;
    setJoiningSeason(true);
    setError(null);
    try {
      setSeasonMembership(await joinUserSeasonLeague(user.uid));
    } catch {
      setError("Could not join the paid league. Try again.");
    } finally {
      setJoiningSeason(false);
    }
  }

  async function handleJoinFriend(number: string) {
    if (!requireUser() || !user || joiningFriend) return;
    setJoiningFriend(true);
    setError(null);
    try {
      const membership = await joinUserFriendLeague(user.uid, number);
      setMemberships((current) => ({ ...current, [membership.leagueId]: membership }));
    } catch {
      setError("Enter a friend league number with at least four digits.");
    } finally {
      setJoiningFriend(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] pt-8 pb-32">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 max-w-3xl">
          <Link href="/card" className="mb-4 inline-block text-sm text-[var(--color-brand-primary)] hover:underline">
            Back
          </Link>
          <h1 className="mb-2 font-display text-4xl font-black">Leagues</h1>
          <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
            Join a league before taking positions. Free leagues track shadow bankrolls with no payouts; paid leagues live in the middle column.
          </p>
        </div>

        {!user && (
          <div className="mb-6 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 text-center">
            <p className="text-sm font-bold text-[var(--color-card-text)]">Sign in to join leagues</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">League memberships sync to your account.</p>
            <button onClick={() => setSignInOpen(true)} className="mt-3 rounded-lg bg-[var(--color-brand-primary)] px-4 py-2 text-xs font-bold text-white">
              Sign in
            </button>
          </div>
        )}

        {user && verificationRequired && (
          <div className="mb-6 max-w-lg">
            <EmailVerificationNotice compact />
          </div>
        )}

        {error && <p className="mb-4 rounded-lg border border-[var(--color-danger)]/30 px-3 py-2 text-xs text-[var(--color-danger)]">{error}</p>}
        {loading && <p className="mb-4 text-xs text-[var(--color-text-muted)]">Loading your leagues...</p>}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_340px]">
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Free Leagues</h2>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">Calendar first, then free friend and sports leagues.</p>
            </div>
            <CalendarTopCard mode="free" />
            <FriendsLeagueBox joining={joiningFriend} onJoin={handleJoinFriend} />
            {groups.map((group) => (
              <SportGroupSection
                key={group.sport}
                group={group}
                memberships={memberships}
                joiningLeagueId={joiningLeagueId}
                onJoin={handleJoin}
              />
            ))}
          </section>

          <PaidLeagueColumn
            membership={seasonMembership}
            joining={joiningSeason}
            onJoin={handleJoinSeason}
            groups={groups}
          />

          <YourLeagues
            memberships={memberships}
            seasonMembership={seasonMembership}
            leaderboards={leaderboards}
          />
        </div>
      </div>
      <SignInSheet open={signInOpen} onClose={() => setSignInOpen(false)} />
    </div>
  );
}
