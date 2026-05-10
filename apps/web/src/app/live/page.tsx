import { LiveClient } from "./live-client";

export const metadata = {
  title: "Live — The Card",
  openGraph: { images: [{ url: "/live/og.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image" as const, images: ["/live/og.png"] },
};

export default function LivePage() {
  return <LiveClient />;
}
