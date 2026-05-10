import { H2HClient } from "./h2h-client";

export const metadata = {
  title: "Head-to-Head — The Card",
  openGraph: { images: [{ url: "/h2h/og.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image" as const, images: ["/h2h/og.png"] },
};

export default function H2HPage() {
  return <H2HClient />;
}
