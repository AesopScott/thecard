import { exchange } from "@/lib/exchange";
import { getAllHostTakes } from "@/lib/editorial";
import { MarketCard } from "@/components/market-card";
import { JackpotBanner } from "@/components/jackpot-banner";
import type { Odds } from "@thecard/types";

export const dynamic = "force-dynamic";

// Mock jackpot — will come from Firestore when backend is wired
const JACKPOT = { amount: 42000, rolloverWeeks: 2, resetsOn: "Sunday" };

export default async function CardPage() {
  const markets = await exchange.getMarkets({ limit: 10 });

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
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-4">

      <header className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-black tracking-tight text-[var(--color-card-text)]">
            Tonight&apos;s Card
          </h1>
          <span className="text-xs text-[var(--color-card-muted)] font-medium uppercase tracking-wider">
            {markets.length} markets
          </span>
        </div>
        <p className="text-sm text-[var(--color-card-muted)]">
          Ten hand-picked markets on tonight&apos;s biggest games.
          The price is the crowd&apos;s confidence — updated live.
        </p>
      </header>

      {/* Perfect 10 jackpot */}
      <JackpotBanner
        amount={JACKPOT.amount}
        rolloverWeeks={JACKPOT.rolloverWeeks}
        resetsOn={JACKPOT.resetsOn}
      />

      {/* What is this — context banner */}
      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 flex flex-col gap-2">
        <p className="text-xs font-semibold text-[var(--color-card-accent)] uppercase tracking-widest">
          What is The Card?
        </p>
        <p className="text-sm text-[var(--color-card-muted)] leading-relaxed">
          A prediction market is a question you can bet on. Instead of picking a winner
          and waiting until Sunday, you buy YES or NO contracts at the current price.
          If you&apos;re right, you get paid $1 per contract. If not, you lose what you put in.
        </p>
        <p className="text-sm text-[var(--color-card-muted)] leading-relaxed">
          The price moves with the betting — as more people buy YES on Mahomes,
          the YES price goes up. That price <em>is</em> the crowd&apos;s forecast.
          If YES is at 70¢, the market thinks there&apos;s a 70% chance it happens.
        </p>
        <p className="text-xs text-[var(--color-card-muted)] mt-1">
          Real-money betting launches soon via Kalshi&apos;s regulated exchange.
          In the meantime,{" "}
          <a href="/learn" className="text-[var(--color-card-accent)] underline underline-offset-2">
            try Practice Mode
          </a>{" "}
          — same markets, no money at risk, real calibration tracking.
        </p>
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

    </div>
  );
}
