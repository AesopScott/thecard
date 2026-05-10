import { exchange } from "@/lib/exchange";
import { LearnClient } from "./learn-client";

export const metadata = { title: "Practice Mode — The Card" };

export default async function LearnPage() {
  const markets = await exchange.getMarkets({ limit: 5 });
  return <LearnClient markets={markets} />;
}
