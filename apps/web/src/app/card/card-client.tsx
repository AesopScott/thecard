"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AskTheCardAi } from "@/components/ask-the-card-ai";
import { ExplainBetting } from "@/components/explain-betting";
import { MarketCard } from "@/components/market-card";
import { JackpotBanner } from "@/components/jackpot-banner";
import { PositionsPanel } from "@/components/positions-panel";
import { UpcomingSportsCard } from "@/components/upcoming-sports-card";
import { SeasonBanner } from "@/components/season-banner";
import { SettlementPanel } from "@/components/settlement-panel";
import { SignInSheet } from "@/components/sign-in-sheet";
import { EmailVerificationNotice } from "@/components/email-verification-notice";
import { ScoutFloaters } from "@/components/scout-mascot";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
import {
  getStoredCardWatchlist,
  readLocalCardWatchlist,
  saveCardWatchlist,
  writeLocalCardWatchlist,
} from "@/lib/card-watchlist-store";
import type { HostTake } from "@/lib/editorial";
import type { Market, Odds, Sport } from "@thecard/types";

type SortMode = "hot" | "closing" | "longshot";
type SportFilter = "all" | Sport;
type RiskProfile = "conservative" | "balanced" | "aggressive";
type TicketSide = "yes" | "no";

interface CardClientProps {
  markets: Market[];
  initialOdds: Record<string, Odds>;
  hostTakes: Record<string, HostTake>;
}

interface TicketPick {
  marketId: string;
  title: string;
  sport: Sport;
  side: TicketSide;
  price: number;
  conviction: string;
}

interface LockedCard {
  date: string;
  picks: TicketPick[];
  risk: RiskProfile;
  projectedScore: number;
  bestBetId: string | null;
  settled: Array<{ marketId: string; hit: boolean; signal: string }>;
}

const TICKET_KEY = "thecard:my-card-ticket:v1";
const LOCKED_KEY = "thecard:locked-card:v1";
const HISTORY_KEY = "thecard:card-history:v1";

const CARD_EXPLANATION = [
  {
    title: "What The Card is",
    body: "The Card is the main daily board of mock sports markets. Each market has a YES price and a NO price, shown like cents. A 63c YES price means the board is treating YES roughly like a 63% outcome.",
  },
  {
    title: "Building your card",
    body: "Add YES or NO picks from the market feed. Your card becomes a ticket preview with projected points, conviction labels, and risk profile. Locking the card saves that daily read so you can compare it later.",
  },
  {
    title: "Model edge",
    body: "The app compares the market price to its own simple model read. A positive YES edge means the model thinks YES is more likely than the price implies. Fade mode flips that recommendation when you want to play against the signal.",
  },
  {
    title: "Risk settings",
    body: "Conservative trims the projection and favors safer reads. Balanced keeps the default model. Aggressive raises the ceiling and leans harder into edge. None of this is real-money wagering; it is a free-to-play prediction score.",
  },
];

const CARD_AI_SUGGESTIONS = [
  "What does 62c YES mean?",
  "How should I use model edge?",
  "Should I use aggressive risk?",
];

function todayId() {
  return new Date().toISOString().slice(0, 10);
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(localStorage.getItem(key) ?? "") as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(value));
}

function hoursUntilClose(market: Market) {
  return Math.max(0, (new Date(market.closesAt).getTime() - Date.now()) / 3_600_000);
}

function modelProbability(market: Market, odds?: Odds, risk: RiskProfile = "balanced") {
  const marketYes = odds?.yes ?? 0.5;
  const sportBias = (market.sport.charCodeAt(0) % 9 - 4) / 100;
  const closeBias = hoursUntilClose(market) < 12 ? 0.025 : 0;
  const riskBias = risk === "conservative" ? -0.015 : risk === "aggressive" ? 0.025 : 0;
  return Math.min(0.92, Math.max(0.08, marketYes + sportBias + closeBias + riskBias));
}

function marketHeat(market: Market, odds?: Odds) {
  const yes = (odds?.yes ?? 0.5) * 100;
  const tossUpBoost = 50 - Math.abs(yes - 50);
  const closeBoost = Math.max(0, 12 - hoursUntilClose(market)) * 2;
  const spreadPenalty = (odds?.spread ?? 0.02) * 100;
  return Math.round(tossUpBoost + closeBoost - spreadPenalty);
}

function signalFor(market: Market, odds?: Odds) {
  if (!odds) return "Loading";
  const yes = Math.round(odds.yes * 100);
  if (hoursUntilClose(market) <= 12) return "Closing";
  if (yes <= 25 || yes >= 75) return "Longshot";
  if (Math.abs(yes - 50) <= 6) return "Toss-up";
  if (marketHeat(market, odds) >= 42) return "Hot";
  return "Steady";
}

function sportLabel(sport: SportFilter) {
  if (sport === "all") return "All";
  if (sport === "ncaaf") return "CFB";
  if (sport === "ncaab") return "CBB";
  return sport.toUpperCase();
}

function defaultSide(market: Market, odds?: Odds, risk: RiskProfile = "balanced"): TicketSide {
  const model = modelProbability(market, odds, risk);
  const yes = odds?.yes ?? 0.5;
  return model >= yes ? "yes" : "no";
}

function convictionFor(market: Market, odds?: Odds, risk: RiskProfile = "balanced") {
  const edge = Math.abs(modelProbability(market, odds, risk) - (odds?.yes ?? 0.5)) * 100;
  if (edge >= 8) return "Hammer";
  if (edge >= 5) return "Strong";
  if (edge >= 3) return "Standard";
  return "Lean";
}

function edgeLabel(market: Market, odds?: Odds, risk: RiskProfile = "balanced") {
  const model = modelProbability(market, odds, risk);
  const yes = odds?.yes ?? 0.5;
  const edge = Math.round((model - yes) * 100);
  if (edge === 0) return "Even";
  return `${edge > 0 ? "+" : ""}${edge} pts`;
}

function edgePoints(market: Market, odds?: Odds, risk: RiskProfile = "balanced") {
  return Math.round((modelProbability(market, odds, risk) - (odds?.yes ?? 0.5)) * 100);
}

function movementFor(market: Market, odds?: Odds) {
  const yes = Math.round((odds?.yes ?? 0.5) * 100);
  const seed = market.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const open = Math.max(8, Math.min(92, yes + (seed % 15) - 7));
  const move = yes - open;
  return `${move > 0 ? "+" : ""}${move}c`;
}

function signalStack(market: Market, odds?: Odds) {
  const yes = Math.round((odds?.yes ?? 0.5) * 100);
  return [
    `${edgeLabel(market, odds)} model edge`,
    hoursUntilClose(market) <= 12 ? "closing window" : "time to shop",
    yes > 65 ? "public favorite" : yes < 35 ? "public fade" : "balanced book",
    market.sport === "nfl" || market.sport === "mlb" ? "weather/news watch" : "lineup note",
  ];
}

function timeGroup(market: Market) {
  const hour = new Date(market.closesAt).getHours();
  if (hour < 16) return "Early";
  if (hour < 20) return "Main";
  return "Late";
}

function projectedScore(picks: TicketPick[], risk: RiskProfile) {
  const base = picks.reduce((sum, pick) => sum + (pick.conviction === "Hammer" ? 3 : pick.conviction === "Strong" ? 2 : 1), 0);
  const multiplier = risk === "conservative" ? 0.85 : risk === "aggressive" ? 1.25 : 1;
  return Math.round(base * multiplier);
}

function settlePreview(picks: TicketPick[]) {
  return picks.map((pick, index) => ({
    marketId: pick.marketId,
    hit: (pick.marketId.charCodeAt(0) + index + todayId().length) % 3 !== 0,
    signal: pick.conviction,
  }));
}

export function CardClient({ markets, initialOdds, hostTakes }: CardClientProps) {
  const { user, verificationRequired } = useAuth();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [sport, setSport] = useState<SportFilter>("all");
  const [sort, setSort] = useState<SortMode>("hot");
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [watchOnly, setWatchOnly] = useState(false);
  const [risk, setRisk] = useState<RiskProfile>("balanced");
  const [fadeMode, setFadeMode] = useState(false);
  const [groupByTime, setGroupByTime] = useState(false);
  const [ticket, setTicket] = useState<Record<string, TicketPick>>({});
  const [lockedCard, setLockedCard] = useState<LockedCard | null>(null);
  const [history, setHistory] = useState<LockedCard[]>([]);
  const [explainId, setExplainId] = useState<string | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [watchlistStatus, setWatchlistStatus] = useState<string | null>(null);

  useEffect(() => {
    setWatchlist(readLocalCardWatchlist());
    setTicket(readJson<Record<string, TicketPick>>(TICKET_KEY, {}));
    const locked = readJson<LockedCard | null>(LOCKED_KEY, null);
    if (locked?.date === todayId()) setLockedCard(locked);
    setHistory(readJson<LockedCard[]>(HISTORY_KEY, []));
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    getStoredCardWatchlist(user.uid)
      .then((marketIds) => {
        if (cancelled) return;
        setWatchlist(marketIds);
        setWatchlistStatus("Watchlist synced.");
        if (!verificationRequired) void saveCardWatchlist(user.uid, marketIds);
      })
      .catch(() => {
        if (!cancelled) setWatchlistStatus("Watchlist sync unavailable.");
      });

    return () => {
      cancelled = true;
    };
  }, [user, verificationRequired]);

  const sports = useMemo(() => ["all", ...Array.from(new Set(markets.map((market) => market.sport)))] as SportFilter[], [markets]);
  const bestBet = useMemo(() => [...markets].sort((a, b) => Math.abs(edgePoints(b, initialOdds[b.id], risk)) - Math.abs(edgePoints(a, initialOdds[a.id], risk)))[0] ?? null, [markets, initialOdds, risk]);
  const featured = useMemo(() => [...markets].sort((a, b) => marketHeat(b, initialOdds[b.id]) - marketHeat(a, initialOdds[a.id])).slice(0, 3), [markets, initialOdds]);

  const filteredMarkets = useMemo(() => {
    const q = query.trim().toLowerCase();
    return markets
      .filter((market) => sport === "all" || market.sport === sport)
      .filter((market) => !watchOnly || watchlist.includes(market.id))
      .filter((market) => !q || `${market.title} ${market.subtitle} ${market.sport}`.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sort === "closing") return hoursUntilClose(a) - hoursUntilClose(b);
        if (sort === "longshot") return (initialOdds[a.id]?.yes ?? 1) - (initialOdds[b.id]?.yes ?? 1);
        return marketHeat(b, initialOdds[b.id]) - marketHeat(a, initialOdds[a.id]);
      });
  }, [initialOdds, markets, query, sort, sport, watchOnly, watchlist]);

  const ticketPicks = Object.values(ticket);
  const avgYes = markets.length ? Math.round(markets.reduce((sum, market) => sum + (initialOdds[market.id]?.yes ?? 0.5) * 100, 0) / markets.length) : 0;
  const closingSoon = markets.filter((market) => hoursUntilClose(market) <= 24).length;
  const explaining = explainId ? markets.find((market) => market.id === explainId) ?? null : null;

  function toggleWatch(marketId: string) {
    setWatchlist((current) => {
      const next = current.includes(marketId) ? current.filter((id) => id !== marketId) : [...current, marketId];
      writeLocalCardWatchlist(next);
      if (user && !verificationRequired) {
        void saveCardWatchlist(user.uid, next)
          .then(() => setWatchlistStatus("Watchlist saved."))
          .catch(() => setWatchlistStatus("Saved locally. Sync will retry later."));
      } else if (user && verificationRequired) {
        setWatchlistStatus("Saved locally. Verify email to sync.");
      } else {
        setWatchlistStatus("Saved locally. Sign in to sync.");
      }
      return next;
    });
  }

  function addToTicket(market: Market, side: TicketSide) {
    const finalSide = fadeMode ? (side === "yes" ? "no" : "yes") : side;
    const odds = initialOdds[market.id];
    const pick: TicketPick = {
      marketId: market.id,
      title: market.title,
      sport: market.sport,
      side: finalSide,
      price: Math.round(((finalSide === "yes" ? odds?.yes : odds?.no) ?? 0.5) * 100),
      conviction: convictionFor(market, odds, risk),
    };
    setTicket((current) => {
      const next = { ...current, [market.id]: pick };
      writeJson(TICKET_KEY, next);
      return next;
    });
  }

  function lockCard() {
    if (!user) {
      setSignInOpen(true);
      return;
    }
    if (verificationRequired || ticketPicks.length === 0) return;
    const locked: LockedCard = {
      date: todayId(),
      picks: ticketPicks,
      risk,
      projectedScore: projectedScore(ticketPicks, risk),
      bestBetId: bestBet?.id ?? null,
      settled: settlePreview(ticketPicks),
    };
    setLockedCard(locked);
    writeJson(LOCKED_KEY, locked);
    const nextHistory = [locked, ...history.filter((item) => item.date !== locked.date)].slice(0, 14);
    setHistory(nextHistory);
    writeJson(HISTORY_KEY, nextHistory);
  }

  async function shareCard() {
    const text = `My Card is ${ticketPicks.length} picks for ${projectedScore(ticketPicks, risk)} projected points (${risk}).`;
    const url = typeof window !== "undefined" ? `${window.location.origin}/card` : "https://thecard.bet/card";
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setShareStatus("Card copied.");
    } catch {
      setShareStatus("Share unavailable.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 pb-28">
      <DevelopmentMockDataRibbon />
      <ScoutFloaters page="card" />

      <header className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--color-brand-primary)]" />
            <span className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("card.liveBoard")}</span>
            {bestBet && <span className="rounded-md bg-[var(--color-brand-primary)] px-2 py-1 text-[10px] font-black uppercase text-white">{t("card.bestBet")}: {sportLabel(bestBet.sport)}</span>}
          </div>
          <h1 className="mt-3 text-5xl font-display font-black tracking-tight text-[var(--color-card-text)]">{t("card.title")}</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)]">{t("card.subtitle")}</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label={t("card.markets")} value={markets.length} />
            <Stat label={t("card.avgYes")} value={`${avgYes}c`} />
            <Stat label={t("card.closing")} value={closingSoon} />
            <Stat label={t("card.projected")} value={projectedScore(ticketPicks, risk)} />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <SeasonBanner variant="compact" />
          <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-2)] p-4">
            <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("card.bridgeModes")}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(["/blitz", "/live", "/h2h", "/forecast"] as const).map((href) => (
                <Link key={href} href={href} className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-surface)] px-3 py-2 text-center text-xs font-black text-[var(--color-card-text)] transition-colors hover:border-[var(--color-brand-primary)]/50">{href.slice(1).toUpperCase()}</Link>
              ))}
            </div>
          </div>
        </div>
      </header>

      <ExplainBetting
        buttonLabel={t("card.explainButton")}
        title={t("card.explainTitle")}
        summary={t("card.explainSummary")}
        sections={CARD_EXPLANATION}
      />

      <AskTheCardAi
        mode="card"
        context="On this page, add YES or NO picks from the market feed, compare price to model edge, choose a risk profile, and lock a daily card when the ticket reflects your best reads."
        suggestions={CARD_AI_SUGGESTIONS}
      />

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("card.featuredHeat")}</p>
            <span className="text-xs font-bold text-[var(--color-text-muted)]">{t("card.topSignals")}</span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {featured.map((market) => (
              <button key={market.id} onClick={() => setExplainId(market.id)} className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-surface-2)] p-3 text-left transition-all hover:border-[var(--color-brand-primary)]/50">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{sportLabel(market.sport)}</span>
                  <span className="text-[10px] font-bold text-[var(--color-text-muted)]">{signalFor(market, initialOdds[market.id])}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-black text-[var(--color-card-text)]">{market.title}</p>
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">{edgeLabel(market, initialOdds[market.id], risk)} edge</p>
              </button>
            ))}
          </div>
        </div>
        <JackpotBanner />
      </section>

      <UpcomingSportsCard />

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("card.searchPlaceholder")} className="min-h-11 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] px-4 text-sm font-semibold text-[var(--color-card-text)] outline-none transition-colors focus:border-[var(--color-brand-primary)]" />
            <div className="grid grid-cols-4 gap-1 rounded-lg bg-[var(--color-surface-2)] p-1">
              {sports.slice(0, 8).map((item) => (
                <button key={item} onClick={() => setSport(item)} className={`rounded-md px-2 py-2 text-[10px] font-black uppercase ${sport === item ? "bg-[var(--color-brand-primary)] text-white" : "text-[var(--color-text-muted)]"}`}>{sportLabel(item)}</button>
              ))}
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Segment values={["conservative", "balanced", "aggressive"] as const} value={risk} onChange={setRisk} />
            <Segment values={["hot", "closing", "longshot"] as const} value={sort} onChange={setSort} />
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-[var(--color-surface-2)] p-1">
              <button onClick={() => setFadeMode((value) => !value)} className={`rounded-md px-2 py-2 text-[10px] font-black uppercase ${fadeMode ? "bg-[var(--color-brand-primary)] text-white" : "text-[var(--color-text-muted)]"}`}>Fade</button>
              <button onClick={() => setWatchOnly((value) => !value)} className={`rounded-md px-2 py-2 text-[10px] font-black uppercase ${watchOnly ? "bg-[var(--color-brand-primary)] text-white" : "text-[var(--color-text-muted)]"}`}>Watch</button>
              <button onClick={() => setGroupByTime((value) => !value)} className={`rounded-md px-2 py-2 text-[10px] font-black uppercase ${groupByTime ? "bg-[var(--color-brand-primary)] text-white" : "text-[var(--color-text-muted)]"}`}>Time</button>
            </div>
          </div>
        </div>

        <MyCardPanel ticketPicks={ticketPicks} risk={risk} lockedCard={lockedCard} history={history} shareStatus={shareStatus} onLock={lockCard} onShare={shareCard} onClear={() => { setTicket({}); writeJson(TICKET_KEY, {}); }} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black uppercase tracking-widest text-[var(--color-card-text)]">{t("card.marketFeed")}</h2>
            <span className="text-right text-xs font-bold text-[var(--color-text-muted)]">{watchlistStatus ?? `${filteredMarkets.length} ${t("card.shown")}`}</span>
          </div>
          {filteredMarkets.length === 0 ? (
            <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-8 text-center">
              <p className="text-sm font-black text-[var(--color-card-text)]">{t("card.noMarkets")}</p>
              <button onClick={() => { setQuery(""); setSport("all"); setWatchOnly(false); }} className="mt-3 rounded-lg border border-[var(--color-card-border)] px-4 py-2 text-xs font-bold text-[var(--color-text-muted)]">{t("card.clearFilters")}</button>
            </div>
          ) : (
            (groupByTime ? ["Early", "Main", "Late"] : ["All"]).map((group) => {
              const groupMarkets = group === "All" ? filteredMarkets : filteredMarkets.filter((market) => timeGroup(market) === group);
              if (groupMarkets.length === 0) return null;
              return (
                <div key={group} className="flex flex-col gap-3">
                  {group !== "All" && <p className="px-1 text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{group}</p>}
                  {groupMarkets.map((market) => {
                    const odds = initialOdds[market.id];
                    const side = fadeMode ? (defaultSide(market, odds, risk) === "yes" ? "no" : "yes") : defaultSide(market, odds, risk);
                    return (
                      <MarketCard
                        key={market.id}
                        market={market}
                        hostTake={hostTakes[market.id]}
                        initialOdds={odds}
                        signal={signalFor(market, odds)}
                        watched={watchlist.includes(market.id)}
                        selectedSide={ticket[market.id]?.side ?? null}
                        conviction={convictionFor(market, odds, risk)}
                        edgeLabel={edgeLabel(market, odds, risk)}
                        movement={movementFor(market, odds)}
                        signalStack={signalStack(market, odds)}
                        onToggleWatch={() => toggleWatch(market.id)}
                        onAddToTicket={(pickedSide) => addToTicket(market, pickedSide)}
                        onExplain={() => setExplainId(market.id)}
                      />
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-2)] p-5">
            <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("card.compareCommunity")}</p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">Your selected card leans {ticketPicks.length === 0 ? "empty" : ticketPicks.filter((pick) => pick.side === "yes").length >= ticketPicks.length / 2 ? "YES-heavy" : "NO-heavy"} versus an average market YES price of {avgYes}c.</p>
          </div>
          <PositionsPanel />
        </aside>
      </section>

      {lockedCard && <PostSettleReview lockedCard={lockedCard} />}
      <SettlementPanel markets={markets.map((market) => ({ id: market.id, title: market.title, sport: market.sport }))} />

      {explaining && <ExplanationDrawer market={explaining} odds={initialOdds[explaining.id]} risk={risk} fadeMode={fadeMode} onClose={() => setExplainId(null)} />}
      {!user && <SignInSheet open={signInOpen} onClose={() => setSignInOpen(false)} />}
      {user && verificationRequired && signInOpen && (
        <div className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-sm">
          <EmailVerificationNotice compact />
        </div>
      )}
    </div>
  );
}

function DevelopmentMockDataRibbon() {
  return (
    <div
      aria-label="In development. All data is currently mock data."
      className="pointer-events-none fixed left-[max(0.75rem,calc(50%-46rem))] top-20 z-20 flex h-36 w-36 origin-top-left scale-[0.72] items-center justify-center rounded-full p-2 text-center shadow-[0_24px_56px_rgba(0,0,0,0.46)] sm:scale-100"
      style={{
        background:
          "conic-gradient(from 18deg, #7f1d1d, #ef4444 16%, #f8fafc 17%, #facc15 25%, #7f1d1d 36%, #ef4444 51%, #f8fafc 52%, #facc15 62%, #7f1d1d 75%, #ef4444 100%)",
      }}
    >
      <div className="absolute -bottom-8 left-5 h-16 w-9 rotate-[14deg] bg-gradient-to-b from-red-500 to-red-950 shadow-[inset_0_-18px_24px_rgba(0,0,0,0.28)] [clip-path:polygon(0_0,100%_0,100%_100%,50%_74%,0_100%)]" />
      <div className="absolute -bottom-8 right-5 h-16 w-9 -rotate-[14deg] bg-gradient-to-b from-red-600 to-red-950 shadow-[inset_0_-18px_24px_rgba(0,0,0,0.28)] [clip-path:polygon(0_0,100%_0,100%_100%,50%_74%,0_100%)]" />
      <div className="absolute inset-2 rounded-full bg-[linear-gradient(145deg,#fff7d6,#d97706_26%,#7f1d1d_55%,#27070a)] p-[3px]">
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.24),transparent_32%),linear-gradient(155deg,#17111a,#2a0d13_58%,#07070b)]" />
      </div>
      <div className="absolute inset-[1.05rem] rounded-full border border-white/12 shadow-[inset_0_0_0_1px_rgba(250,204,21,0.28),inset_0_-18px_32px_rgba(0,0,0,0.42)]" />
      <div className="relative flex h-[6.35rem] w-[6.35rem] flex-col items-center justify-center rounded-full px-3 text-white">
        <span className="rounded-full border border-amber-200/40 bg-amber-300/12 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.24em] text-amber-100">Preview</span>
        <span className="mt-1.5 text-[1.38rem] font-display font-black uppercase leading-none tracking-normal">Mock</span>
        <span className="text-[1.38rem] font-display font-black uppercase leading-none tracking-normal text-amber-100">Data</span>
        <span className="mt-1 text-[8px] font-black uppercase leading-tight tracking-[0.18em] text-white/70">In Development</span>
      </div>
    </div>
  );
}

function MyCardPanel({ ticketPicks, risk, lockedCard, history, shareStatus, onLock, onShare, onClear }: { ticketPicks: TicketPick[]; risk: RiskProfile; lockedCard: LockedCard | null; history: LockedCard[]; shareStatus: string | null; onLock: () => void; onShare: () => void; onClear: () => void }) {
  const { t } = useI18n();
  return (
    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("card.myCard")}</p>
        <p className="text-xs font-bold text-[var(--color-text-muted)]">{ticketPicks.length} {t("card.picks")}</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Stat label={t("card.preview")} value={projectedScore(ticketPicks, risk)} />
        <Stat label={t("card.risk")} value={risk} />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {ticketPicks.length === 0 ? <p className="text-sm text-[var(--color-text-muted)]">{t("card.emptyTicket")}</p> : ticketPicks.map((pick) => (
          <div key={pick.marketId} className="rounded-lg bg-[var(--color-surface-2)] px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-xs font-bold text-[var(--color-card-text)]">{pick.title}</p>
              <span className={pick.side === "yes" ? "text-xs font-black text-[var(--color-card-yes)]" : "text-xs font-black text-[var(--color-card-no)]"}>{pick.side.toUpperCase()}</span>
            </div>
            <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">{pick.conviction} - {pick.price}c</p>
          </div>
        ))}
      </div>
      {lockedCard && <p className="mt-3 rounded-lg bg-[var(--color-brand-primary)]/10 px-3 py-2 text-xs font-bold text-[var(--color-card-text)]">Locked today for {lockedCard.projectedScore} projected points. Saved to profile artifact locally.</p>}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button onClick={onLock} className="rounded-lg bg-[var(--color-brand-primary)] px-3 py-2 text-xs font-black text-white">{t("card.lock")}</button>
        <button onClick={onShare} className="rounded-lg border border-[var(--color-card-border)] px-3 py-2 text-xs font-black text-[var(--color-text-muted)]">{t("card.share")}</button>
        <button onClick={onClear} className="rounded-lg border border-[var(--color-card-border)] px-3 py-2 text-xs font-black text-[var(--color-text-muted)]">{t("card.clear")}</button>
      </div>
      {shareStatus && <p className="mt-2 text-center text-xs font-bold text-[var(--color-success)]">{shareStatus}</p>}
      <div className="mt-4">
        <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("card.history")}</p>
        {history.length === 0 ? <p className="mt-2 text-xs text-[var(--color-text-muted)]">{t("card.historyEmpty")}</p> : history.slice(0, 3).map((item) => (
          <div key={item.date} className="mt-2 flex items-center justify-between rounded-lg bg-[var(--color-surface-2)] px-3 py-2 text-xs">
            <span className="font-bold text-[var(--color-card-text)]">{item.date}</span>
            <span className="text-[var(--color-text-muted)]">{item.projectedScore} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExplanationDrawer({ market, odds, risk, fadeMode, onClose }: { market: Market; odds?: Odds; risk: RiskProfile; fadeMode: boolean; onClose: () => void }) {
  const side = defaultSide(market, odds, risk);
  const shownSide = fadeMode ? (side === "yes" ? "NO" : "YES") : side.toUpperCase();
  return (
    <div className="fixed inset-x-4 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-[80] mx-auto max-h-[calc(100dvh-8rem)] max-w-lg overflow-y-auto rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Pick explanation</p>
          <h3 className="mt-2 text-xl font-display font-black text-[var(--color-card-text)]">{market.title}</h3>
        </div>
        <button onClick={onClose} className="rounded-lg border border-[var(--color-card-border)] px-3 py-2 text-xs font-black text-[var(--color-text-muted)]">Close</button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Stat label="Pick" value={shownSide} />
        <Stat label="Conviction" value={convictionFor(market, odds, risk)} />
        <Stat label="Model" value={`${Math.round(modelProbability(market, odds, risk) * 100)}%`} />
        <Stat label="Market" value={`${Math.round((odds?.yes ?? 0.5) * 100)}c`} />
      </div>
      <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">The model view weighs price edge, movement, close time, and sport context. {fadeMode ? "Fade mode is showing the opposite side, including the risk that the original signal may still be right." : "The selected side is the cleaner recommendation for this risk profile."}</p>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {(["/blitz", "/h2h", "/live", "/forecast"] as const).map((href) => <Link key={href} href={href} className="rounded-lg border border-[var(--color-card-border)] px-2 py-2 text-center text-[10px] font-black text-[var(--color-text-muted)]">{href.slice(1)}</Link>)}
      </div>
    </div>
  );
}

function PostSettleReview({ lockedCard }: { lockedCard: LockedCard }) {
  const hits = lockedCard.settled.filter((item) => item.hit).length;
  return (
    <section className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5">
      <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Post-settle review</p>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Preview settlement has {hits}/{lockedCard.picks.length} hits. Strongest signal: {lockedCard.settled[0]?.signal ?? "none"}.</p>
    </section>
  );
}

function Segment<T extends string>({ values, value, onChange }: { values: readonly T[]; value: T; onChange: (value: T) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-lg bg-[var(--color-surface-2)] p-1">
      {values.map((item) => (
        <button key={item} onClick={() => onChange(item)} className={`rounded-md px-2 py-2 text-[10px] font-black uppercase ${value === item ? "bg-[var(--color-brand-primary)] text-white" : "text-[var(--color-text-muted)]"}`}>{item}</button>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-surface-2)] px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-[var(--color-card-text)]">{value}</p>
    </div>
  );
}
