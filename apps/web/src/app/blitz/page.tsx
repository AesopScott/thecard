import { BlitzClient } from "./blitz-client";

export const metadata = {
  title: "Blitz — The Card",
  openGraph: { images: [{ url: "/blitz/og.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image" as const, images: ["/blitz/og.png"] },
};

export default function BlitzPage() {
  return <BlitzClient />;
}
