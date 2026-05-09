import { exchange } from "@/lib/exchange";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const markets = await exchange.getMarkets({ limit: 5 });

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-black tracking-tight text-[var(--color-card-text)]">
          Practice Mode
        </h1>
        <p className="text-sm text-[var(--color-card-muted)] mt-1">
          Bet play-money. Build calibration. No account needed.
        </p>
      </header>

      <section className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[var(--color-card-accent)] uppercase tracking-wider">
          Today&apos;s Questions
        </h2>
        <ul className="flex flex-col gap-3">
          {markets.map((market) => (
            <li
              key={market.id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="text-[var(--color-card-text)] leading-snug">
                {market.title}
              </span>
              <button className="shrink-0 text-xs font-semibold text-[var(--color-card-accent)] border border-[var(--color-card-accent-dim)] rounded-lg px-3 py-1.5 hover:bg-[var(--color-card-accent-dim)] transition-colors">
                Predict
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5">
        <h2 className="text-sm font-semibold text-[var(--color-card-muted)] uppercase tracking-wider mb-3">
          Your Calibration
        </h2>
        <p className="text-4xl font-black text-[var(--color-card-text)]">—</p>
        <p className="text-xs text-[var(--color-card-muted)] mt-1">
          Make 5+ predictions to unlock your score
        </p>
      </section>
    </div>
  );
}
