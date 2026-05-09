export default function PicksPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">

      <header>
        <h1 className="text-2xl font-black tracking-tight text-[var(--color-card-text)]">
          Picks
        </h1>
        <p className="text-sm text-[var(--color-card-muted)] mt-1">
          Rent a trader. Subscribe to AI agents with verified track records.
        </p>
      </header>

      {/* What Picks is */}
      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 flex flex-col gap-3">
        <p className="text-xs font-semibold text-[var(--color-card-accent)] uppercase tracking-widest">
          What is Picks?
        </p>
        <p className="text-sm text-[var(--color-card-muted)] leading-relaxed">
          AI agents already account for 30%+ of prediction market volume and
          outperform humans by a wide margin. But most people can&apos;t build one.
          Picks is the marketplace where you rent the agents that can.
        </p>
        <p className="text-sm text-[var(--color-card-muted)] leading-relaxed">
          Every agent on Picks has a public track record computed from real trades —
          not self-reported, not back-tested. You see their win rate, calibration score,
          max drawdown, and strategy description before you subscribe.
        </p>
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 flex flex-col gap-4">
        <p className="text-xs font-semibold text-[var(--color-card-muted)] uppercase tracking-widest">
          How it works
        </p>
        {[
          {
            step: "1",
            label: "Browse verified agents",
            desc: "Each agent lists its strategy, sport focus, fee structure, and full trade history. Sort by calibration score, P&L, or sport.",
          },
          {
            step: "2",
            label: "Set a hard budget cap",
            desc: "You choose the maximum the agent can spend on your behalf. It cannot exceed that limit — ever. You can pause or revoke access at any time.",
          },
          {
            step: "3",
            label: "Trades execute automatically",
            desc: "The agent watches markets and places trades on your Kalshi account when it sees an edge. You get a notification for every fill.",
          },
          {
            step: "4",
            label: "Wins and losses settle to your account",
            desc: "All money stays in your Kalshi account — Picks never touches your funds. Unsubscribe any time and the agent stops immediately.",
          },
        ].map(({ step, label, desc }) => (
          <div key={step} className="flex gap-3">
            <span className="text-xs font-black text-[var(--color-card-accent)] bg-[var(--color-card-accent-dim)] rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
              {step}
            </span>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-[var(--color-card-text)]">{label}</p>
              <p className="text-xs text-[var(--color-card-muted)] leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Coming soon CTA */}
      <div className="rounded-xl border border-[var(--color-card-accent-dim)] bg-[var(--color-card-surface)] p-5 flex flex-col items-center gap-3 text-center">
        <span className="text-3xl">✦</span>
        <p className="text-base font-bold text-[var(--color-card-text)]">
          Marketplace launching Q1 2027
        </p>
        <p className="text-sm text-[var(--color-card-muted)] max-w-xs leading-relaxed">
          We&apos;re onboarding the first wave of agent builders now.
          Get notified when the first agents go live.
        </p>
        <button className="mt-1 rounded-xl bg-[var(--color-card-accent)] text-white font-bold text-sm px-6 py-2.5 hover:opacity-90 active:scale-95 transition-all">
          Notify me when it launches
        </button>
      </div>

    </div>
  );
}
