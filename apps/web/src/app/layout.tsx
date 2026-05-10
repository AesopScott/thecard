import type { Metadata, Viewport } from "next";
import { Inter, Syne } from "next/font/google";
import { Providers } from "@/components/providers";
import { Nav } from "@/components/nav";
import { UserButton } from "@/components/user-button";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const syne = Syne({ subsets: ["latin"], variable: "--font-display", weight: ["400", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "The Card",
  description: "Ten markets. Live. Loud.",
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
    <html lang="en" className={`${inter.variable} ${syne.variable}`}>
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
