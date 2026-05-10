import { BlitzClient } from "./blitz-client";
import { VERSION } from "@/lib/version";

export const metadata = {
  title: "Blitz — The Card",
  openGraph: { images: [{ url: `/blitz/opengraph-image.png?v=${VERSION}`, width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", images: [`/blitz/opengraph-image.png?v=${VERSION}`] },
};

export default function BlitzPage() {
  return <BlitzClient />;
}
