import { LiveClient } from "./live-client";
import { VERSION } from "@/lib/version";

export const metadata = {
  title: "Live — The Card",
  openGraph: { images: [{ url: `/live/opengraph-image.png?v=${VERSION}`, width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", images: [`/live/opengraph-image.png?v=${VERSION}`] },
};

export default function LivePage() {
  return <LiveClient />;
}
