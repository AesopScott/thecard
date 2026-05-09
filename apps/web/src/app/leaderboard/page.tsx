export default function LeaderboardPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-black tracking-tight text-[var(--color-card-text)]">
          Leaderboard
        </h1>
        <p className="text-sm text-[var(--color-card-muted)] mt-1">
          Top forecasters this week
        </p>
      </header>

      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] divide-y divide-[var(--color-card-border)]">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <span className="text-sm font-black text-[var(--color-card-muted)] w-5 text-center">
              {i + 1}
            </span>
            <div className="w-8 h-8 rounded-full bg-[var(--color-card-border)]" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--color-card-text)]">
                —
              </p>
              <p className="text-xs text-[var(--color-card-muted)]">
                No predictions yet
              </p>
            </div>
            <span className="text-sm font-bold text-[var(--color-card-yes)]">
              —
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
