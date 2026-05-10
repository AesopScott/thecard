import { exchange } from "@/lib/exchange";
import { LearnClient } from "./learn-client";

export default async function LearnPage() {
  const markets = await exchange.getMarkets({ limit: 5 });
  return <LearnClient markets={markets} />;
}
