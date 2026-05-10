import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import { Providers } from "@/components/providers";
import { Nav } from "@/components/nav";
import { UserButton } from "@/components/user-button";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-display", weight: ["400", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "The Card",
  description: "Curated markets. Live. Loud.",
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
          <UserButton />
          <main className="pb-20 min-h-dvh">{children}</main>
          <Nav />
        </Providers>
      </body>
    </html>
  );
}
