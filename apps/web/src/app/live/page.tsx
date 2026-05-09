import { exchange } from "@/lib/exchange";
import { MarketCard } from "@/components/market-card";

export const dynamic = "force-dynamic";

export default async function LivePage() {
  const markets = await exchange.getMarkets({ status: "open" });

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-black tracking-tight text-[var(--color-card-text)]">
          Live Now
        </h1>
        <p className="text-sm text-[var(--color-card-muted)] mt-1">
          Pick a game. Go deep.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        {markets.map((market) => (
          <MarketCard key={market.id} market={market} />
        ))}
      </div>
    </div>
  );
}
