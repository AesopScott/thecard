import { LeaguesClient } from "./leagues-client";
import { VERSION } from "@/lib/version";

export const metadata = {
  title: "Leagues — The Card",
  openGraph: { images: [{ url: `/leagues/opengraph-image.png?v=${VERSION}`, width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", images: [`/leagues/opengraph-image.png?v=${VERSION}`] },
};

export default function LeaguesPage() {
  return <LeaguesClient />;
}
