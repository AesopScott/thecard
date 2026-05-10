import { exchange } from "@/lib/exchange";
import { LearnClient } from "./learn-client";
import { VERSION } from "@/lib/version";

export const metadata = {
  title: "Practice Mode — The Card",
  openGraph: { images: [{ url: `/learn/opengraph-image.png?v=${VERSION}`, width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", images: [`/learn/opengraph-image.png?v=${VERSION}`] },
};

export default async function LearnPage() {
  const markets = await exchange.getMarkets({ limit: 5 });
  return <LearnClient markets={markets} />;
}
