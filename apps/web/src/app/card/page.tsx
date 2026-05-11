import { exchange } from "@/lib/exchange";
import { getAllHostTakes } from "@/lib/editorial";
import { CardClient } from "./card-client";
import type { Odds } from "@thecard/types";

export const metadata = {
  title: "Tonight's Card - The Card",
  openGraph: { images: [{ url: "/card/og.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image" as const, images: ["/card/og.png"] },
};

export default async function CardPage() {
  const markets = await exchange.getMarkets({ limit: 25 });
  const rawOdds = await Promise.all(markets.map((market) => exchange.getOdds(market.id)));
  const oddsMap: Record<string, Odds> = {};

  markets.forEach((market, index) => {
    const odds = rawOdds[index];
    if (odds) oddsMap[market.id] = odds;
  });

  const hostTakes = await getAllHostTakes(markets, oddsMap);

  return <CardClient markets={markets} initialOdds={oddsMap} hostTakes={hostTakes} />;
}
