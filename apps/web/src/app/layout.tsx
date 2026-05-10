import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import { Providers } from "@/components/providers";
import { Nav } from "@/components/nav";
import { UserButton } from "@/components/user-button";
import { OnboardingSheet } from "@/components/onboarding-sheet";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-display", weight: ["400", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://thecard.bet"),
  title: "The Card",
  description: "Sports prediction markets for fans, not traders. Real odds, live updates, compete for the jackpot.",
  openGraph: {
    title: "The Card",
    description: "Sports prediction markets for fans, not traders.",
    siteName: "The Card",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "The Card" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Card",
    description: "Sports prediction markets for fans, not traders.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <Providers>
          <div
            className="fixed inset-0 pointer-events-none"
            style={{ background: "linear-gradient(135deg, transparent 0%, rgba(255,60,60,0.25) 50%, transparent 100%)", animation: "breathe 8s ease-in-out infinite", zIndex: 0 }}
          />
          <UserButton />
          <OnboardingSheet />
          <main className="pb-20 min-h-dvh">{children}</main>
          <Nav />
        </Providers>
      </body>
    </html>
  );
}
