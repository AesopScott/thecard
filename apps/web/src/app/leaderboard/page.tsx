import { LeaderboardClient } from "./leaderboard-client";
import { VERSION } from "@/lib/version";

export const metadata = {
  title: "Leaderboard — The Card",
  openGraph: { images: [{ url: `/leaderboard/opengraph-image.png?v=${VERSION}`, width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", images: [`/leaderboard/opengraph-image.png?v=${VERSION}`] },
};

export default function LeaderboardPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">

      <header className="flex flex-col gap-2 pt-2">
        <h1 className="text-4xl font-display font-black tracking-tight text-[var(--color-card-text)]">
          Leaderboard
        </h1>
        <p className="text-base text-[var(--color-text-secondary)]">
          Season rank by bankroll growth. Calibration score shows skill vs luck.
        </p>
      </header>

      {/* Live leaderboard */}
      <LeaderboardClient />

      {/* What a ranked forecaster looks like */}
      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-2)] p-5 flex flex-col gap-3">
        <p className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest">
          ✓ Verified forecasters
        </p>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          Top forecasters get a verified badge and public profile. Their track records are visible on every market.
          You can follow them or mirror a percentage of their position with one tap.
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">
          Verification requires 50+ predictions and a calibration score above 65.
        </p>
      </div>

    </div>
  );
}
