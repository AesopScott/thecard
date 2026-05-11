"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MarketCard } from "@/components/market-card";
import { JackpotBanner } from "@/components/jackpot-banner";
import { PositionsPanel } from "@/components/positions-panel";
import { UpcomingSportsCard } from "@/components/upcoming-sports-card";
import { SeasonBanner } from "@/components/season-banner";
import { SettlementPanel } from "@/components/settlement-panel";
import type { HostTake } from "@/lib/editorial";
import type { Market, Odds, Sport } from "@thecard/types";

type SortMode = "hot" | "closing" | "longshot";
type SportFilter = "all" | Sport;

interface CardClientProps {
  markets: Market[];
  initialOdds: Record<string, Odds>;
  hostTakes: Record<string, HostTake>;
}

const WATCHLIST_KEY = "thecard:watchlist:v1";

function readWatchlist() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(WATCHLIST_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function hoursUntilClose(market: Market) {
  return Math.max(0, (new Date(market.closesAt).getTime() - Date.now()) / 3_600_000);
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
  if (hoursUntilClose(market) <= 24) return "Closing";
  if (yes <= 20 || yes >= 80) return "Longshot";
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

export function CardClient({ markets, initialOdds, hostTakes }: CardClientProps) {
  const [query, setQuery] = useState("");
  const [sport, setSport] = useState<SportFilter>("all");
  const [sort, setSort] = useState<SortMode>("hot");
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [watchOnly, setWatchOnly] = useState(false);

  useEffect(() => setWatchlist(readWatchlist()), []);

  const sports = useMemo(() => ["all", ...Array.from(new Set(markets.map((market) => market.sport)))] as SportFilter[], [markets]);

  const featured = useMemo(
    () => [...markets].sort((a, b) => marketHeat(b, initialOdds[b.id]) - marketHeat(a, initialOdds[a.id])).slice(0, 3),
    [markets, initialOdds]
  );

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

  const avgYes = markets.length
    ? Math.round(markets.reduce((sum, market) => sum + (initialOdds[market.id]?.yes ?? 0.5) * 100, 0) / markets.length)
    : 0;
  const closingSoon = markets.filter((market) => hoursUntilClose(market) <= 24).length;

  function toggleWatch(marketId: string) {
    setWatchlist((current) => {
      const next = current.includes(marketId) ? current.filter((id) => id !== marketId) : [...current, marketId];
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
      return next;
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 pb-28">
      <header className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--color-brand-primary)]" />
            <span className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Live board</span>
          </div>
          <h1 className="mt-3 text-5xl font-display font-black tracking-tight text-[var(--color-card-text)]">Tonight&apos;s Card</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)]">
            Curated mock markets, live-moving odds, play-money bankroll, and fast paths into every mode.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Markets" value={markets.length} />
            <Stat label="Avg YES" value={`${avgYes}c`} />
            <Stat label="Closing" value={closingSoon} />
            <Stat label="Watching" value={watchlist.length} />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <SeasonBanner variant="compact" />
          <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-2)] p-4">
            <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Jump in</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {([
                ["/blitz", "Blitz"],
                ["/live", "Live"],
                ["/h2h", "H2H"],
                ["/forecast", "Forecast"],
              ] satisfies Array<[string, string]>).map(([href, label]) => (
                <Link key={href} href={href} className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-surface)] px-3 py-2 text-center text-xs font-black text-[var(--color-card-text)] transition-colors hover:border-[var(--color-brand-primary)]/50">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Featured heat</p>
            <span className="text-xs font-bold text-[var(--color-text-muted)]">Top 3 activity signals</span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {featured.map((market) => (
              <button
                key={market.id}
                onClick={() => {
                  setQuery(market.title);
                  setSport("all");
                  setWatchOnly(false);
                }}
                className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-surface-2)] p-3 text-left transition-all hover:border-[var(--color-brand-primary)]/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{sportLabel(market.sport)}</span>
                  <span className="text-[10px] font-bold text-[var(--color-text-muted)]">{signalFor(market, initialOdds[market.id])}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-black text-[var(--color-card-text)]">{market.title}</p>
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">{Math.round((initialOdds[market.id]?.yes ?? 0.5) * 100)}c YES</p>
              </button>
            ))}
          </div>
        </div>
        <JackpotBanner />
      </section>

      <UpcomingSportsCard />

      <section className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search teams, props, sports"
            className="min-h-11 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] px-4 text-sm font-semibold text-[var(--color-card-text)] outline-none transition-colors focus:border-[var(--color-brand-primary)]"
          />
          <div className="grid grid-cols-4 gap-1 rounded-lg bg-[var(--color-surface-2)] p-1">
            {sports.slice(0, 8).map((item) => (
              <button key={item} onClick={() => setSport(item)} className={`rounded-md px-2 py-2 text-[10px] font-black uppercase ${sport === item ? "bg-[var(--color-brand-primary)] text-white" : "text-[var(--color-text-muted)]"}`}>
                {sportLabel(item)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-1 rounded-lg bg-[var(--color-surface-2)] p-1">
            {(["hot", "closing", "longshot"] as SortMode[]).map((item) => (
              <button key={item} onClick={() => setSort(item)} className={`rounded-md px-2 py-2 text-[10px] font-black uppercase ${sort === item ? "bg-[var(--color-brand-primary)] text-white" : "text-[var(--color-text-muted)]"}`}>
                {item}
              </button>
            ))}
            <button onClick={() => setWatchOnly((value) => !value)} className={`rounded-md px-2 py-2 text-[10px] font-black uppercase ${watchOnly ? "bg-[var(--color-brand-primary)] text-white" : "text-[var(--color-text-muted)]"}`}>
              Watch
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black uppercase tracking-widest text-[var(--color-card-text)]">Market Feed</h2>
            <span className="text-xs font-bold text-[var(--color-text-muted)]">{filteredMarkets.length} shown</span>
          </div>
          {filteredMarkets.length === 0 ? (
            <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-8 text-center">
              <p className="text-sm font-black text-[var(--color-card-text)]">No markets match this view.</p>
              <button onClick={() => { setQuery(""); setSport("all"); setWatchOnly(false); }} className="mt-3 rounded-lg border border-[var(--color-card-border)] px-4 py-2 text-xs font-bold text-[var(--color-text-muted)]">
                Clear filters
              </button>
            </div>
          ) : filteredMarkets.map((market) => (
            <MarketCard
              key={market.id}
              market={market}
              hostTake={hostTakes[market.id]}
              initialOdds={initialOdds[market.id]}
              signal={signalFor(market, initialOdds[market.id])}
              watched={watchlist.includes(market.id)}
              onToggleWatch={() => toggleWatch(market.id)}
            />
          ))}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-2)] p-5">
            <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">How prices read</p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              A 62c YES price means the crowd is implying roughly a 62% chance. Buy YES if your number is higher, NO if your number is lower.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Stat label="Toss-up" value="45-55c" />
              <Stat label="Longshot" value="<20c" />
            </div>
          </div>
          <PositionsPanel />
        </aside>
      </section>

      <SettlementPanel markets={markets.map((market) => ({ id: market.id, title: market.title, sport: market.sport }))} />
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
