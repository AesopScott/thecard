import { exchange } from "@/lib/exchange";
import { MarketCard } from "@/components/market-card";

export const dynamic = "force-dynamic";

export default async function CardPage() {
  const markets = await exchange.getMarkets({ limit: 10 });

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-4">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-black tracking-tight text-[var(--color-card-text)]">
          Tonight&apos;s Card
        </h1>
        <span className="text-xs text-[var(--color-card-muted)] font-medium uppercase tracking-wider">
          {markets.length} markets
        </span>
      </header>

      <div className="flex flex-col gap-3">
        {markets.map((market) => (
          <MarketCard key={market.id} market={market} />
        ))}
      </div>
    </div>
  );
}
