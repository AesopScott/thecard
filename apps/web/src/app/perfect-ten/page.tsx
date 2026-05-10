import { PerfectTenClient } from "./perfect-ten-client";
import { VERSION } from "@/lib/version";

export const metadata = {
  title: "Perfect 10 — The Card",
  openGraph: { images: [{ url: `/perfect-ten/opengraph-image.png?v=${VERSION}`, width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", images: [`/perfect-ten/opengraph-image.png?v=${VERSION}`] },
};

export default function PerfectTenPage() {
  return <PerfectTenClient />;
}
