import { H2HClient } from "./h2h-client";
import { VERSION } from "@/lib/version";

export const metadata = {
  title: "Head-to-Head — The Card",
  openGraph: { images: [{ url: `/h2h/opengraph-image.png?v=${VERSION}`, width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", images: [`/h2h/opengraph-image.png?v=${VERSION}`] },
};

export default function H2HPage() {
  return <H2HClient />;
}
