export default function PicksPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-black tracking-tight text-[var(--color-card-text)]">
          Picks
        </h1>
        <p className="text-sm text-[var(--color-card-muted)] mt-1">
          Rent a trader. Subscribe to verified AI agents.
        </p>
      </header>

      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-8 flex flex-col items-center gap-3 text-center">
        <span className="text-4xl">✦</span>
        <p className="text-[var(--color-card-text)] font-semibold">
          Agent marketplace coming soon
        </p>
        <p className="text-sm text-[var(--color-card-muted)] max-w-xs">
          Verified AI trading agents with public track records.
          Be notified when the first agents go live.
        </p>
        <button className="mt-2 rounded-lg bg-[var(--color-card-accent)] text-white font-semibold text-sm px-6 py-2.5 hover:opacity-90 transition-opacity">
          Notify me
        </button>
      </div>
    </div>
  );
}
