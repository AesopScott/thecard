import { exchange } from "@/lib/exchange";
import { getAllHostTakes } from "@/lib/editorial";
import { MarketCard } from "@/components/market-card";
import { JackpotBanner } from "@/components/jackpot-banner";
import { PositionsPanel } from "@/components/positions-panel";
import { UpcomingSportsCard } from "@/components/upcoming-sports-card";
import { SeasonBanner } from "@/components/season-banner";
import { VERSION } from "@/lib/version";
import type { Odds } from "@thecard/types";

export const metadata = {
  title: "Tonight's Card — The Card",
  openGraph: { images: [{ url: `/card/opengraph-image.png?v=${VERSION}`, width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", images: [`/card/opengraph-image.png?v=${VERSION}`] },
};

export default async function CardPage() {
  const markets = await exchange.getMarkets({ limit: 25 });

  // Fetch all odds and host takes in parallel
  const [oddsResults, hostTakes] = await Promise.all([
    Promise.all(markets.map((m) => exchange.getOdds(m.id))),
    (async () => {
      const oddsMap: Record<string, Odds> = {};
      const rawOdds = await Promise.all(markets.map((m) => exchange.getOdds(m.id)));
      markets.forEach((m, i) => {
        const o = rawOdds[i];
        if (o) oddsMap[m.id] = o;
      });
      return getAllHostTakes(markets, oddsMap);
    })(),
  ]);

  void oddsResults; // odds are fetched client-side for live updates; server fetch here is for SSR only

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">

      <header className="flex flex-col gap-3 pt-2">
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl font-display font-black tracking-tight text-[var(--color-card-text)]">
            Tonight&apos;s Card
          </h1>
          <p className="text-base text-[var(--color-text-secondary)] leading-relaxed">
            Curated markets. Live odds. Real money on the line.
          </p>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-brand-primary)]"></span>
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              LIVE NOW
            </span>
          </div>
          <span className="text-xs text-[var(--color-text-muted)] font-medium uppercase tracking-wider">
            {markets.length} markets
          </span>
        </div>
      </header>

      {/* Season bankroll */}
      <SeasonBanner variant="compact" />

      {/* Upcoming sports calendar */}
      <UpcomingSportsCard />

      {/* Perfect 10 jackpot */}
      <JackpotBanner />

      {/* What is this — context banner */}
      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-2)] p-5 flex flex-col gap-3">
        <p className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest">
          How it works
        </p>
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            A prediction market is a question you can bet on. Buy YES or NO contracts at the current price.
            If you&apos;re right, you get paid $1 per contract. The price moves with betting—that price <em>is</em> the crowd&apos;s forecast.
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Real-money betting launches soon via Kalshi&apos;s regulated exchange.
            In the meantime,{" "}
            <a href="/blitz" className="text-[var(--color-brand-primary)] font-bold hover:underline">
              try Blitz
            </a>
            {" "}— 5 markets, 15 seconds each, daily scoring.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {markets.map((market) => (
          <MarketCard
            key={market.id}
            market={market}
            hostTake={hostTakes[market.id]}
          />
        ))}
      </div>

      {/* Open positions — only renders when user is signed in and has positions */}
      <PositionsPanel />

    </div>
  );
}
