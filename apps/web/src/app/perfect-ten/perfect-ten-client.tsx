"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  CURRENT_CONTEST,
  P10_PICK_EVENT,
  countdownToLock,
  formatDollars,
  getPick,
  getStoredPick,
  isLocked,
  savePickDraft,
  setPick,
  submitStoredPicks,
} from "@/lib/perfect-ten-store";
import { exchange } from "@/lib/exchange";
import { useAuth } from "@/contexts/auth-context";
import { EmailVerificationNotice } from "@/components/email-verification-notice";
import { SignInSheet } from "@/components/sign-in-sheet";
import type { Market, Odds, PerfectTenPick, Sport } from "@thecard/types";

type PickSide = "yes" | "no";
type DemoTicket = "balanced" | "chalk" | "longshot";
type RecapScenario = "perfect" | "badBeat" | "busted";

interface MarketMeta {
  modelPick: PickSide;
  modelEdge: number;
  lockLabel: string;
  difficulty: "Chalk" | "Toss-up" | "Trap" | "Longshot";
  confidence: "Anchor" | "Lean" | "Sweat";
  result: PickSide;
  recapNote: string;
}

const SPORT_ICONS: Record<Sport, string> = {
  nfl: "🏈",
  nba: "🏀",
  mlb: "⚾",
  nhl: "🏒",
  ncaaf: "🏈",
  ncaab: "🏀",
  soccer: "⚽",
  ufc: "🥊",
  other: "🏅",
};

const MARKET_META: Record<string, MarketMeta> = {
  "mock-nfl-01": {
    modelPick: "yes",
    modelEdge: 7,
    lockLabel: "Sun 8:20p",
    difficulty: "Chalk",
    confidence: "Anchor",
    result: "yes",
    recapNote: "Chiefs price held firm after public money arrived late.",
  },
  "mock-nfl-02": {
    modelPick: "no",
    modelEdge: 4,
    lockLabel: "Sun 8:20p",
    difficulty: "Toss-up",
    confidence: "Lean",
    result: "no",
    recapNote: "The passing prop stayed under when the Raiders slowed the game down.",
  },
  "mock-nfl-03": {
    modelPick: "yes",
    modelEdge: 3,
    lockLabel: "Sun 4:25p",
    difficulty: "Trap",
    confidence: "Sweat",
    result: "no",
    recapNote: "The spread was the danger leg; a late field goal flipped it.",
  },
  "mock-nba-01": {
    modelPick: "no",
    modelEdge: 9,
    lockLabel: "Tue 10:00p",
    difficulty: "Longshot",
    confidence: "Anchor",
    result: "no",
    recapNote: "Fading the longshot was the cleanest value on the board.",
  },
  "mock-ufc-01": {
    modelPick: "yes",
    modelEdge: 5,
    lockLabel: "Sat 11:00p",
    difficulty: "Chalk",
    confidence: "Lean",
    result: "yes",
    recapNote: "The favorite survived a messy second round.",
  },
  "mock-mlb-01": {
    modelPick: "no",
    modelEdge: 8,
    lockLabel: "Fri 7:05p",
    difficulty: "Longshot",
    confidence: "Anchor",
    result: "no",
    recapNote: "The futures fade helped balance the ticket.",
  },
  "mock-ncaaf-01": {
    modelPick: "yes",
    modelEdge: 5,
    lockLabel: "Sat 3:30p",
    difficulty: "Longshot",
    confidence: "Lean",
    result: "yes",
    recapNote: "This was the upside leg that made the perfect path pop.",
  },
  "mock-soccer-01": {
    modelPick: "no",
    modelEdge: 6,
    lockLabel: "Sat 12:30p",
    difficulty: "Trap",
    confidence: "Lean",
    result: "no",
    recapNote: "The market was crowded on the favorite, so the fade mattered.",
  },
  "mock-ncaab-01": {
    modelPick: "yes",
    modelEdge: 2,
    lockLabel: "Thu 9:40p",
    difficulty: "Longshot",
    confidence: "Sweat",
    result: "yes",
    recapNote: "The rare hit leg is what separates a normal card from a jackpot sweat.",
  },
  "mock-nhl-01": {
    modelPick: "no",
    modelEdge: 7,
    lockLabel: "Sat 7:00p",
    difficulty: "Longshot",
    confidence: "Anchor",
    result: "no",
    recapNote: "The cup future was priced too optimistically.",
  },
};

const DEMO_TICKETS: Record<DemoTicket, Record<string, PickSide>> = {
  balanced: {
    "mock-nfl-01": "yes",
    "mock-nfl-02": "no",
    "mock-nfl-03": "yes",
    "mock-nba-01": "no",
    "mock-ufc-01": "yes",
    "mock-mlb-01": "no",
    "mock-ncaaf-01": "yes",
    "mock-soccer-01": "no",
    "mock-ncaab-01": "yes",
    "mock-nhl-01": "no",
  },
  chalk: {
    "mock-nfl-01": "yes",
    "mock-nfl-02": "yes",
    "mock-nfl-03": "no",
    "mock-nba-01": "no",
    "mock-ufc-01": "yes",
    "mock-mlb-01": "no",
    "mock-ncaaf-01": "no",
    "mock-soccer-01": "no",
    "mock-ncaab-01": "no",
    "mock-nhl-01": "no",
  },
  longshot: {
    "mock-nfl-01": "no",
    "mock-nfl-02": "yes",
    "mock-nfl-03": "yes",
    "mock-nba-01": "yes",
    "mock-ufc-01": "no",
    "mock-mlb-01": "yes",
    "mock-ncaaf-01": "yes",
    "mock-soccer-01": "yes",
    "mock-ncaab-01": "yes",
    "mock-nhl-01": "yes",
  },
};

const RECAP_MISSES: Record<RecapScenario, Set<string>> = {
  perfect: new Set(),
  badBeat: new Set(["mock-nfl-03"]),
  busted: new Set(["mock-nfl-02", "mock-nfl-03", "mock-ufc-01", "mock-soccer-01"]),
};

function priceForSide(odds: Odds | undefined, side: PickSide | undefined) {
  if (!odds || !side) return null;
  return Math.round((side === "yes" ? odds.yes : odds.no) * 100);
}

function slotTone(index: number, picked: boolean) {
  if (picked) return "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/12 text-[var(--color-card-text)]";
  if (index < 3) return "border-red-500/35 bg-red-500/8 text-red-200";
  return "border-[var(--color-card-border)] bg-black/10 text-[var(--color-text-muted)]";
}

function parFor(markets: Market[], odds: Record<string, Odds>, picks: Record<string, PickSide>) {
  const prices = markets
    .map((market) => priceForSide(odds[market.id], picks[market.id] ?? MARKET_META[market.id]?.modelPick))
    .filter((price): price is number => price !== null);
  const avg = prices.length ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 50;
  if (avg >= 68) return { label: "Par 8", mood: "Chalky board", detail: "Most paths should hit 7-8 if the favorites behave." };
  if (avg >= 54) return { label: "Par 7", mood: "Balanced board", detail: "A clean ticket needs anchors plus two uncomfortable calls." };
  return { label: "Par 6", mood: "Brutal board", detail: "The jackpot path is live, but nobody gets there by coasting." };
}

function balanceFor(markets: Market[], picks: Record<string, PickSide>, odds: Record<string, Odds>) {
  const selected = markets.filter((market) => picks[market.id]);
  const yesCount = selected.filter((market) => picks[market.id] === "yes").length;
  const sports = new Set(selected.map((market) => market.sport));
  const chalkCount = selected.filter((market) => {
    const price = priceForSide(odds[market.id], picks[market.id]);
    return price !== null && price >= 70;
  }).length;
  const longshotCount = selected.filter((market) => {
    const price = priceForSide(odds[market.id], picks[market.id]);
    return price !== null && price <= 35;
  }).length;

  const warnings = [];
  if (selected.length < 10) warnings.push("Fill every slot before this becomes a real Perfect 10 ticket.");
  if (yesCount >= 8) warnings.push("YES-heavy ticket. Consider whether you are chasing upside too hard.");
  if (yesCount <= 2 && selected.length >= 8) warnings.push("NO-heavy ticket. Good for fading hype, but watch correlated futures.");
  if (sports.size <= 3 && selected.length >= 8) warnings.push("Sport concentration is high. One bad league read can break the card.");
  if (chalkCount >= 7) warnings.push("Too chalky for a jackpot chase. Safe picks still need a perfect path.");
  if (longshotCount >= 5) warnings.push("Longshot ladder. Electric if it hits, fragile if one favorite cruises.");
  if (warnings.length === 0) warnings.push("Balanced build: anchors, fades, and a few sweat legs are all represented.");

  return {
    yesCount,
    noCount: selected.length - yesCount,
    sportCount: sports.size,
    chalkCount,
    longshotCount,
    warnings,
  };
}

export function PerfectTenClient() {
  const { user, verificationRequired } = useAuth();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [odds, setOdds] = useState<Record<string, Odds>>({});
  const [pick, setPicked] = useState<PerfectTenPick>(() => getPick(CURRENT_CONTEST.id));
  const [countdown, setCountdown] = useState(countdownToLock);
  const [locked, setLocked] = useState(isLocked);
  const [submitted, setSubmitted] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [demoTicket, setDemoTicket] = useState<DemoTicket>("balanced");
  const [recapScenario, setRecapScenario] = useState<RecapScenario>("badBeat");

  useEffect(() => {
    exchange.getMarkets({ limit: 10 }).then(async (all) => {
      const ordered = CURRENT_CONTEST.marketIds
        .map((id) => all.find((market) => market.id === id))
        .filter((market): market is Market => !!market);
      const nextMarkets = ordered.length ? ordered : all.filter((market) => CURRENT_CONTEST.marketIds.includes(market.id));
      setMarkets(nextMarkets);
      const entries = await Promise.all(nextMarkets.map(async (market) => [market.id, await exchange.getOdds(market.id)] as const));
      setOdds(Object.fromEntries(entries.filter((entry): entry is readonly [string, Odds] => !!entry[1])));
    });
  }, []);

  const refresh = useCallback(() => {
    const nextPick = getPick(CURRENT_CONTEST.id);
    setPicked(nextPick);
    setSubmitted(nextPick.isSubmitted);
    setLocked(isLocked());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(P10_PICK_EVENT, refresh);
    return () => window.removeEventListener(P10_PICK_EVENT, refresh);
  }, [refresh]);

  useEffect(() => {
    if (!user || verificationRequired) return;
    getStoredPick(user.uid, CURRENT_CONTEST.id)
      .then((stored) => {
        setPicked(stored);
        setSubmitted(stored.isSubmitted);
      })
      .catch(() => setSaveError("Could not load your saved Perfect 10 entry."));
  }, [user, verificationRequired]);

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(countdownToLock());
      setLocked(isLocked());
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  function handlePick(marketId: string, side: PickSide) {
    if (!user) {
      setSignInOpen(true);
      return;
    }
    if (verificationRequired) return;
    const updated = setPick(CURRENT_CONTEST.id, marketId, side);
    setPicked(updated);
    savePickDraft(user.uid, updated).catch(() => {
      setSaveError("Pick saved locally, but could not sync to your account.");
    });
  }

  async function handleSubmit() {
    if (!user) {
      setSignInOpen(true);
      return;
    }
    if (verificationRequired) return;
    const result = await submitStoredPicks(user.uid, CURRENT_CONTEST.id).catch(() => {
      setSaveError("Could not lock your picks. Try again.");
      return null;
    });
    if (result) {
      setPicked(result);
      setSubmitted(true);
    }
  }

  const pickedCount = Object.keys(pick.picks).length;
  const total = CURRENT_CONTEST.marketIds.length;
  const allPicked = pickedCount === total;
  const analysisPicks = pickedCount > 0 ? pick.picks : DEMO_TICKETS[demoTicket];
  const par = useMemo(() => parFor(markets, odds, analysisPicks), [analysisPicks, markets, odds]);
  const balance = useMemo(() => balanceFor(markets, analysisPicks, odds), [analysisPicks, markets, odds]);

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] pt-8 pb-32">
      <div className="mx-auto max-w-6xl px-4">
        <header className="mb-6">
          <Link href="/card" className="mb-4 inline-block text-sm text-[var(--color-brand-primary)] hover:underline">
            Back to Card
          </Link>
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">
                Perfect 10 / {CURRENT_CONTEST.weekLabel}
              </p>
              <h1 className="text-5xl font-display font-black tracking-tight text-[var(--color-brand-primary)]">
                {formatDollars(CURRENT_CONTEST.jackpotAmount)}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
                Build all 10 legs, check whether the lineup is too chalky or too wild, then watch the ticket turn into a live sweat after lock.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                    {locked ? "Picks" : "Locks in"}
                  </p>
                  <p className="mt-1 text-xl font-black text-[var(--color-card-text)]">{locked ? "Locked" : countdown}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Daily par</p>
                  <p className="mt-1 text-xl font-black text-[var(--color-brand-primary)]">{par.label}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-[var(--color-text-muted)]">{par.mood}: {par.detail}</p>
            </div>
          </div>
        </header>

        {!user && (
          <div className="mb-4 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
            <p className="text-sm font-bold text-[var(--color-card-text)]">Sign in to lock your entry</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              You can preview every P-10 feature with mock tickets, but real entries are account-bound.
            </p>
            <button
              type="button"
              onClick={() => setSignInOpen(true)}
              className="mt-3 rounded-lg bg-[var(--color-brand-primary)] px-4 py-2 text-xs font-bold text-white"
            >
              Sign in
            </button>
          </div>
        )}

        {user && verificationRequired && (
          <div className="mb-4">
            <EmailVerificationNotice compact />
          </div>
        )}

        {saveError && (
          <p className="mb-4 rounded-lg border border-[var(--color-card-no)]/30 bg-[var(--color-card-no-dim)] px-3 py-2 text-xs text-[var(--color-card-no)]">
            {saveError}
          </p>
        )}

        <section className="mb-5 grid gap-3 lg:grid-cols-3">
          <DemoControls demoTicket={demoTicket} recapScenario={recapScenario} onDemoTicket={setDemoTicket} onRecapScenario={setRecapScenario} />
          <LineupBalance balance={balance} />
          <ProgressCard pickedCount={pickedCount} total={total} submitted={submitted} />
        </section>

        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
          <main className="space-y-5">
            <TicketBuilder markets={markets} odds={odds} picks={pick.picks} analysisPicks={analysisPicks} />

            <section className="overflow-hidden rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)]">
              <div className="border-b border-[var(--color-card-border)] px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Pick board</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">Difficulty labels, prices, confidence, and mock model edges are shown on every leg.</p>
              </div>
              <div className="divide-y divide-[var(--color-card-border)]">
                {markets.length === 0
                  ? Array.from({ length: 10 }, (_, index) => <MarketSkeleton key={index} />)
                  : markets.map((market, index) => (
                      <MarketPickRow
                        key={market.id}
                        index={index}
                        market={market}
                        odds={odds[market.id]}
                        meta={MARKET_META[market.id]}
                        pick={pick.picks[market.id]}
                        demoPick={analysisPicks[market.id]}
                        locked={locked || submitted || verificationRequired}
                        onPick={handlePick}
                      />
                    ))}
              </div>
            </section>

            <SubmitPanel
              allPicked={allPicked}
              pickedCount={pickedCount}
              total={total}
              locked={locked}
              submitted={submitted}
              verificationRequired={verificationRequired}
              onSubmit={handleSubmit}
            />
          </main>

          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <SweatMode markets={markets} picks={analysisPicks} odds={odds} recapScenario={recapScenario} />
            <PerfectPathRecap markets={markets} picks={analysisPicks} recapScenario={recapScenario} />
          </aside>
        </div>

        <section className="mt-8 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">How it works</p>
          <div className="mt-2 grid gap-2 text-xs leading-relaxed text-[var(--color-text-muted)] md:grid-cols-3">
            <p>Pick YES or NO on all 10 markets before they lock. If every one resolves your way, you win the jackpot.</p>
            <p>Par score, ticket balance, and difficulty labels help explain whether today&apos;s board is easy, normal, or brutal.</p>
            <p>After lock, Sweat Mode and the recap show the path to 10/10, the bad beat, and which pick carried the ticket.</p>
          </div>
        </section>

        <SignInSheet open={signInOpen} onClose={() => setSignInOpen(false)} />
      </div>
    </div>
  );
}

function DemoControls({
  demoTicket,
  recapScenario,
  onDemoTicket,
  onRecapScenario,
}: {
  demoTicket: DemoTicket;
  recapScenario: RecapScenario;
  onDemoTicket: (value: DemoTicket) => void;
  onRecapScenario: (value: RecapScenario) => void;
}) {
  return (
    <section className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Mock options</p>
      <div className="mt-3 grid grid-cols-3 gap-1">
        {(["balanced", "chalk", "longshot"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onDemoTicket(option)}
            className={`rounded-lg border px-2 py-2 text-[10px] font-black capitalize ${demoTicket === option ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-white" : "border-[var(--color-card-border)] text-[var(--color-text-muted)]"}`}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1">
        {(["perfect", "badBeat", "busted"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onRecapScenario(option)}
            className={`rounded-lg border px-2 py-2 text-[10px] font-black ${recapScenario === option ? "border-[var(--color-card-yes)] bg-[var(--color-card-yes-dim)] text-[var(--color-card-yes)]" : "border-[var(--color-card-border)] text-[var(--color-text-muted)]"}`}
          >
            {option === "badBeat" ? "Bad beat" : option}
          </button>
        ))}
      </div>
    </section>
  );
}

function LineupBalance({ balance }: { balance: ReturnType<typeof balanceFor> }) {
  return (
    <section className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Lineup balance</p>
      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        <MiniMetric label="YES" value={String(balance.yesCount)} />
        <MiniMetric label="NO" value={String(balance.noCount)} />
        <MiniMetric label="Sports" value={String(balance.sportCount)} />
        <MiniMetric label="Dogs" value={String(balance.longshotCount)} />
      </div>
      <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-muted)]">{balance.warnings[0]}</p>
    </section>
  );
}

function ProgressCard({ pickedCount, total, submitted }: { pickedCount: number; total: number; submitted: boolean }) {
  return (
    <section className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Survival meter</p>
        {submitted && <span className="text-xs font-black text-[var(--color-card-yes)]">Locked in</span>}
      </div>
      <p className="mt-2 text-3xl font-display font-black text-[var(--color-card-text)]">{pickedCount}/{total}</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--color-card-border)]">
        <motion.div
          className="h-full rounded-full bg-[var(--color-brand-primary)]"
          initial={{ width: 0 }}
          animate={{ width: `${(pickedCount / total) * 100}%` }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        />
      </div>
    </section>
  );
}

function TicketBuilder({
  markets,
  odds,
  picks,
  analysisPicks,
}: {
  markets: Market[];
  odds: Record<string, Odds>;
  picks: Record<string, PickSide>;
  analysisPicks: Record<string, PickSide>;
}) {
  return (
    <section className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Perfect ticket builder</p>
          <h2 className="mt-1 text-xl font-display font-black text-[var(--color-card-text)]">10 locked slots, no hiding places.</h2>
        </div>
        <Link href="/card" className="rounded-lg border border-[var(--color-card-border)] px-3 py-2 text-xs font-bold text-[var(--color-card-text)]">
          Open Card
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {CURRENT_CONTEST.marketIds.map((marketId, index) => {
          const market = markets.find((item) => item.id === marketId);
          const savedPick = picks[marketId];
          const demoPick = analysisPicks[marketId];
          const price = priceForSide(odds[marketId], savedPick ?? demoPick);
          return (
            <div key={marketId} className={`rounded-lg border p-3 ${slotTone(index, !!savedPick)}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest">Leg {index + 1}</span>
                <span className="text-xs font-black">{savedPick ?? demoPick ?? "--"}</span>
              </div>
              <p className="mt-2 line-clamp-2 min-h-8 text-xs font-semibold">{market?.title ?? "Loading market"}</p>
              <p className="mt-2 text-[10px] text-[var(--color-text-muted)]">{price ? `${price}c / ${MARKET_META[marketId]?.confidence ?? "Lean"}` : "Choose side"}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MarketPickRow({
  index,
  market,
  odds,
  meta,
  pick,
  demoPick,
  locked,
  onPick,
}: {
  index: number;
  market: Market;
  odds?: Odds;
  meta?: MarketMeta;
  pick?: PickSide;
  demoPick?: PickSide;
  locked: boolean;
  onPick: (marketId: string, side: PickSide) => void;
}) {
  return (
    <div className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex items-start gap-3">
          <span className="w-5 shrink-0 text-right text-xs font-black text-[var(--color-text-muted)]">{index + 1}</span>
          <span className="shrink-0 text-base">{SPORT_ICONS[market.sport] ?? "🏅"}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-snug text-[var(--color-card-text)]">{market.title}</p>
            <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">{market.subtitle}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Pill>{meta?.difficulty ?? "Toss-up"}</Pill>
              <Pill>{meta?.confidence ?? "Lean"}</Pill>
              <Pill>{meta ? `Edge +${meta.modelEdge}` : "Edge +3"}</Pill>
              <Pill>{meta?.lockLabel ?? "This week"}</Pill>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        {(["yes", "no"] as const).map((side) => {
          const chosen = pick === side;
          const demo = !pick && demoPick === side;
          const price = priceForSide(odds, side);
          const color = side === "yes" ? "var(--color-card-yes)" : "var(--color-card-no)";
          const dimColor = side === "yes" ? "var(--color-card-yes-dim)" : "var(--color-card-no-dim)";
          return (
            <button
              key={side}
              type="button"
              disabled={locked}
              onClick={() => onPick(market.id, side)}
              className="min-w-16 rounded-lg border px-3 py-2 text-[10px] font-black uppercase transition-all disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor: chosen ? dimColor : demo ? "rgba(255,255,255,0.04)" : "transparent",
                color: chosen ? color : demo ? "var(--color-card-text)" : "var(--color-text-muted)",
                borderColor: chosen ? color : demo ? "var(--color-brand-primary)" : "var(--color-card-border)",
              }}
            >
              {side}
              <span className="block text-[9px] opacity-70">{price ? `${price}c` : "--"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SweatMode({
  markets,
  picks,
  odds,
  recapScenario,
}: {
  markets: Market[];
  picks: Record<string, PickSide>;
  odds: Record<string, Odds>;
  recapScenario: RecapScenario;
}) {
  const misses = RECAP_MISSES[recapScenario];
  const resolved = markets.slice(0, recapScenario === "busted" ? 7 : 6);
  const hits = resolved.filter((market) => !misses.has(market.id)).length;
  const live = Math.max(0, 10 - resolved.length);

  return (
    <section className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Sweat mode</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-4xl font-display font-black text-[var(--color-card-text)]">{hits}/{resolved.length}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{live} legs still live in this mock sweat.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${misses.size ? "bg-red-500/15 text-red-300" : "bg-[var(--color-card-yes-dim)] text-[var(--color-card-yes)]"}`}>
          {misses.size ? "At risk" : "Perfect live"}
        </span>
      </div>
      <div className="mt-4 space-y-2">
        {markets.slice(0, 10).map((market, index) => {
          const isResolved = index < resolved.length;
          const missed = misses.has(market.id);
          const side = picks[market.id] ?? MARKET_META[market.id]?.modelPick;
          return (
            <div key={market.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-card-border)] bg-black/10 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-[var(--color-card-text)]">{market.title}</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">{side?.toUpperCase()} / {priceForSide(odds[market.id], side) ?? "--"}c</p>
              </div>
              <span className={`shrink-0 text-[10px] font-black uppercase ${!isResolved ? "text-[var(--color-text-muted)]" : missed ? "text-red-300" : "text-[var(--color-card-yes)]"}`}>
                {!isResolved ? "Live" : missed ? "Miss" : "Hit"}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PerfectPathRecap({
  markets,
  picks,
  recapScenario,
}: {
  markets: Market[];
  picks: Record<string, PickSide>;
  recapScenario: RecapScenario;
}) {
  const misses = RECAP_MISSES[recapScenario];
  const hits = Math.max(0, markets.length - misses.size);
  const bestHit = markets.find((market) => picks[market.id] && (MARKET_META[market.id]?.difficulty === "Longshot" || MARKET_META[market.id]?.confidence === "Sweat"));
  const missedMarket = markets.find((market) => misses.has(market.id));

  return (
    <section className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Perfect path recap</p>
      <h2 className="mt-2 text-2xl font-display font-black text-[var(--color-card-text)]">
        {recapScenario === "perfect" ? "10/10 jackpot path" : recapScenario === "badBeat" ? "9/10 bad beat" : `${hits}/10 broken ticket`}
      </h2>
      <div className="mt-4 space-y-3">
        <RecapRow label="Best pick" value={bestHit?.title ?? "Longshot leg pending"} detail={bestHit ? MARKET_META[bestHit.id]?.recapNote : "Pick a demo ticket to preview rare-hit language."} />
        <RecapRow label="Missed pick" value={missedMarket?.title ?? "None"} detail={missedMarket ? MARKET_META[missedMarket.id]?.recapNote : "Clean board. Every leg stayed on the perfect path."} />
        <RecapRow label="Next adjustment" value={recapScenario === "busted" ? "Reduce correlation" : "Keep the anchor/fade mix"} detail={recapScenario === "perfect" ? "This ticket balanced favorites with enough unpopular sides to matter." : "The recap tells users what broke instead of just showing a score."} />
      </div>
    </section>
  );
}

function SubmitPanel({
  allPicked,
  pickedCount,
  total,
  locked,
  submitted,
  verificationRequired,
  onSubmit,
}: {
  allPicked: boolean;
  pickedCount: number;
  total: number;
  locked: boolean;
  submitted: boolean;
  verificationRequired: boolean;
  onSubmit: () => void;
}) {
  return (
    <AnimatePresence mode="wait">
      {submitted ? (
        <motion.div
          key="submitted"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[var(--color-card-yes)]/30 bg-[var(--color-card-yes-dim)] p-4 text-center"
        >
          <p className="text-sm font-bold text-[var(--color-card-yes)]">Your Perfect 10 picks are locked in.</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">Sweat Mode takes over after the markets begin resolving.</p>
        </motion.div>
      ) : locked ? (
        <motion.div key="locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 text-center">
          <p className="text-sm font-semibold text-[var(--color-text-muted)]">Picks are locked for this week.</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">Come back next week for a fresh contest.</p>
        </motion.div>
      ) : (
        <motion.div key="submit" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!allPicked || verificationRequired}
            className="w-full rounded-xl border border-[var(--color-card-border)] py-3.5 text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40"
            style={{
              backgroundColor: allPicked ? "var(--color-brand-primary)" : "var(--color-card-surface)",
              color: allPicked ? "#fff" : "var(--color-text-muted)",
            }}
          >
            {allPicked ? "Lock in my Perfect 10 picks" : `Pick ${total - pickedCount} more to submit`}
          </button>
          <p className="mt-2 text-center text-[10px] text-[var(--color-text-muted)]">One entry per week / Free / No purchase required</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-card-border)] bg-black/10 px-2 py-2">
      <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-black text-[var(--color-card-text)]">{value}</p>
    </div>
  );
}

function Pill({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-[var(--color-card-border)] bg-black/10 px-2 py-1 text-[10px] font-bold text-[var(--color-text-muted)]">
      {children}
    </span>
  );
}

function RecapRow({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-card-border)] bg-black/10 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-black text-[var(--color-card-text)]">{value}</p>
      {detail && <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">{detail}</p>}
    </div>
  );
}

function MarketSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-3 px-4 py-4">
      <div className="h-3 w-5 rounded bg-[var(--color-card-border)]" />
      <div className="h-3 flex-1 rounded bg-[var(--color-card-border)]" />
      <div className="h-8 w-28 rounded bg-[var(--color-card-border)]" />
    </div>
  );
}
