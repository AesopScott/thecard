import { exchange } from "@/lib/exchange";
import { LearnClient } from "./learn-client";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const markets = await exchange.getMarkets({ limit: 5 });
  return <LearnClient markets={markets} />;
}
