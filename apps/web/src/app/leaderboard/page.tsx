export default function LeaderboardPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">

      <header>
        <h1 className="text-2xl font-black tracking-tight text-[var(--color-card-text)]">
          Leaderboard
        </h1>
        <p className="text-sm text-[var(--color-card-muted)] mt-1">
          The sharpest forecasters, ranked by how right they are — not how loud.
        </p>
      </header>

      {/* What this ranks */}
      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 flex flex-col gap-3">
        <p className="text-xs font-semibold text-[var(--color-card-accent)] uppercase tracking-widest">
          How ranking works
        </p>
        <p className="text-sm text-[var(--color-card-muted)] leading-relaxed">
          This leaderboard doesn&apos;t rank by win rate — it ranks by{" "}
          <strong className="text-[var(--color-card-text)]">calibration</strong>.
          A calibrated forecaster says 70% and is right about 70% of the time.
          That&apos;s harder than it sounds. Most people are overconfident.
        </p>
        <p className="text-sm text-[var(--color-card-muted)] leading-relaxed">
          Scores are computed from the Brier score — the same method used by
          superforecasters, meteorologists, and professional risk analysts.
          A score near 100 means your stated probabilities match reality almost perfectly.
        </p>
      </div>

      {/* Empty state */}
      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] divide-y divide-[var(--color-card-border)]">
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--color-card-muted)] uppercase tracking-wider">Forecaster</span>
          <span className="text-xs font-semibold text-[var(--color-card-muted)] uppercase tracking-wider">Calibration</span>
        </div>
        <div className="px-4 py-8 flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-semibold text-[var(--color-card-text)]">
            No forecasters yet
          </p>
          <p className="text-xs text-[var(--color-card-muted)] max-w-xs leading-relaxed">
            Make predictions in Practice Mode to build your track record.
            After 5 resolved predictions your calibration score unlocks
            and you&apos;ll appear here.
          </p>
          <a
            href="/learn"
            className="mt-2 text-xs font-semibold text-[var(--color-card-accent)] border border-[var(--color-card-accent-dim)] rounded-lg px-4 py-1.5 hover:bg-[var(--color-card-accent-dim)] transition-colors"
          >
            Start in Practice Mode
          </a>
        </div>
      </div>

      {/* What a ranked forecaster looks like */}
      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 flex flex-col gap-3">
        <p className="text-xs font-semibold text-[var(--color-card-muted)] uppercase tracking-widest">
          Verified forecasters
        </p>
        <p className="text-sm text-[var(--color-card-muted)] leading-relaxed">
          The top forecasters on The Card get a verified badge and a public profile.
          Their track records are visible on every market they&apos;ve predicted —
          other users can follow them or mirror a percentage of their position
          with one tap.
        </p>
        <p className="text-xs text-[var(--color-card-muted)]">
          Verification requires 50+ resolved predictions and a calibration score above 65.
        </p>
      </div>

    </div>
  );
}
