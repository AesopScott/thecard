export default function LivePage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">

      <header>
        <h1 className="text-2xl font-black tracking-tight text-[var(--color-card-text)]">
          Live
        </h1>
        <p className="text-sm text-[var(--color-card-muted)] mt-1">
          One game. Every market. In real time.
        </p>
      </header>

      {/* What this will be */}
      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5 flex flex-col gap-3">
        <p className="text-xs font-semibold text-[var(--color-card-accent)] uppercase tracking-widest">
          Coming with NFL Season
        </p>
        <p className="text-sm text-[var(--color-card-muted)] leading-relaxed">
          Live mode is the second-screen experience for fans already watching a game.
          Pick one matchup and see every market tied to it — next score, drive outcome,
          player props — updating with the action in sub-second real time.
        </p>
        <p className="text-sm text-[var(--color-card-muted)] leading-relaxed">
          While The Card is a curated feed across ten events, Live goes deep on one.
          Think of it as the difference between SportsCenter and the RedZone channel.
        </p>
      </div>

      {/* What you'd see here */}
      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5 flex flex-col gap-4">
        <p className="text-xs font-semibold text-[var(--color-card-muted)] uppercase tracking-widest">
          What Live mode shows
        </p>
        {[
          {
            label: "Live odds bar",
            desc: "Odds movement visualized in real time as the action unfolds — you see the crowd shifting before the next play.",
          },
          {
            label: "In-play micromarkets",
            desc: "Fast-moving markets tied to what's happening right now: next score, next TD, drive outcome. Open for seconds, not days.",
          },
          {
            label: "Live commentary",
            desc: "An AI host breaks down each market as it moves — why is YES going up? Who just got injured? What does the line mean?",
          },
          {
            label: "One-tap betting",
            desc: "Press YES or NO directly from the commentary feed. Confirm, done. No navigating away from the action.",
          },
        ].map(({ label, desc }) => (
          <div key={label} className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-[var(--color-card-text)]">{label}</p>
            <p className="text-xs text-[var(--color-card-muted)] leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--color-card-accent-dim)] bg-[var(--color-card-surface)] p-4 flex flex-col gap-2">
        <p className="text-sm font-semibold text-[var(--color-card-text)]">
          Ready to practice before it launches?
        </p>
        <p className="text-xs text-[var(--color-card-muted)] leading-relaxed">
          The markets on The Card are the same ones Live will use. Start building
          your calibration score in Practice Mode now — your track record carries over.
        </p>
        <a
          href="/learn"
          className="mt-1 text-center text-sm font-semibold text-[var(--color-card-accent)] border border-[var(--color-card-accent-dim)] rounded-lg py-2.5 hover:bg-[var(--color-card-accent-dim)] transition-colors"
        >
          Go to Practice Mode →
        </a>
      </div>

    </div>
  );
}
