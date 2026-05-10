import Link from "next/link";

const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Predict the outcome",
    desc: "Set a probability — not just YES or NO. 72% means you think it's likely, not certain. Precision is the whole game.",
  },
  {
    n: "02",
    title: "See where the crowd stands",
    desc: "Every question shows the current market price — the aggregated confidence of everyone playing. Beat it consistently and you have an edge.",
  },
  {
    n: "03",
    title: "Your Brier score updates",
    desc: "Markets resolve with the real event. Your calibration score measures whether your confidence matched reality — not just whether you were right.",
  },
  {
    n: "04",
    title: "Climb the leaderboard. Win prizes.",
    desc: "Top forecasters each season split a real cash prize pool. Season 1: $25,000. No subscription required to compete.",
  },
];

const FEATURES = [
  {
    title: "Calibration score",
    desc: "Brier-scored accuracy across every prediction you've ever made. The same method used by meteorologists and military analysts.",
  },
  {
    title: "You vs the crowd",
    desc: "Every resolved prediction shows where you were vs where the market was. Find your edge — and know when the crowd is wrong.",
  },
  {
    title: "Daily streak",
    desc: "Predict something every day. Your streak is public on the leaderboard and factors into seasonal standings.",
  },
  {
    title: "Seasonal prizes",
    desc: "Company-funded prize pools, not user stakes. Not gambling — forecasting. Season 1 launches with $25K for top performers.",
  },
];

// Mock resolved predictions for the hero preview
const MOCK_PREDICTIONS = [
  { sport: "NFL", title: "Chiefs to win Super Bowl LX", you: 70, mkt: 62, outcome: "yes" as const },
  { sport: "NBA", title: "Lakers make the playoffs", you: 35, mkt: 54, outcome: "no" as const },
  { sport: "MKT", title: "Fed holds rates in June", you: 80, mkt: 73, outcome: "yes" as const },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-surface-0)] text-[var(--color-text-primary)]">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface-0)]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <span className="font-display font-black text-xl tracking-tight">
          Forecast
        </span>
        <Link
          href="/learn"
          className="text-sm font-bold px-4 py-2 rounded-lg bg-[var(--color-brand-primary)] text-white hover:bg-red-500 transition-all"
        >
          Start free
        </Link>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-6 py-16 flex flex-col gap-10 max-w-lg mx-auto w-full">
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #ff3c3c 0%, transparent 70%)" }}
        />

        <div className="relative flex flex-col gap-5">
          <div className="inline-flex items-center gap-2 w-fit rounded-full border border-[var(--color-border)] px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-primary)] animate-pulse" />
            <span className="text-[11px] font-bold text-[var(--color-brand-primary)] uppercase tracking-widest">
              Season 1 · Now Open
            </span>
          </div>

          <h1 className="text-5xl font-display font-black tracking-tight leading-[1.0]">
            The crowd<br />is wrong.<br />
            <span className="text-[var(--color-brand-primary)]">Prove it.</span>
          </h1>

          <p className="text-base text-[var(--color-text-secondary)] leading-relaxed max-w-sm">
            Daily predictions on sports, markets, and world events.
            Track your calibration score. Compete on the leaderboard.
            Win real prizes.
          </p>

          <div className="flex gap-3 pt-1 flex-wrap">
            <Link
              href="/learn"
              className="px-6 py-3 rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-sm hover:bg-red-500 transition-all hover:shadow-[0_0_24px_rgba(255,60,60,0.4)] active:scale-95"
            >
              Start predicting free
            </Link>
            <Link
              href="/leaderboard"
              className="px-6 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold text-sm hover:border-[var(--color-brand-primary)]/50 hover:text-[var(--color-text-primary)] transition-all"
            >
              See leaderboard
            </Link>
          </div>
        </div>

        {/* Mock calibration card */}
        <div className="relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] overflow-hidden shadow-xl">
          <div className="absolute top-3 right-3 z-10">
            <span className="text-[10px] font-bold text-[var(--color-text-muted)] bg-[var(--color-surface-2)] px-2 py-1 rounded-full border border-[var(--color-border)]">
              Preview
            </span>
          </div>

          {/* Score header */}
          <div className="px-5 pt-5 pb-4 border-b border-[var(--color-border)] flex items-end gap-3">
            <span className="text-5xl font-black leading-none" style={{ color: "#f59e0b" }}>78</span>
            <div className="flex flex-col gap-0.5 pb-1">
              <span className="text-sm font-bold" style={{ color: "#f59e0b" }}>Calibrated</span>
              <span className="text-xs text-[var(--color-text-muted)]">14 resolved · 6-day streak</span>
            </div>
          </div>

          {/* Prediction history rows */}
          <div className="px-5 py-3 flex flex-col gap-3">
            {MOCK_PREDICTIONS.map((p) => {
              const outcomeColor = p.outcome === "yes" ? "#22c55e" : "#ef4444";
              return (
                <div key={p.title} className="flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] font-bold text-[var(--color-brand-primary)] uppercase tracking-widest shrink-0">
                        {p.sport}
                      </span>
                      <span className="text-xs text-[var(--color-text-primary)] font-medium truncate">
                        {p.title}
                      </span>
                    </div>
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0"
                      style={{ color: outcomeColor, background: `${outcomeColor}22` }}
                    >
                      {p.outcome === "yes" ? "✓ YES" : "✗ NO"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 h-1 rounded-full bg-[var(--color-border)] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${p.you}%`, backgroundColor: outcomeColor }}
                      />
                      <div
                        className="absolute top-0 bottom-0 w-px bg-white/60"
                        style={{ left: `${p.mkt}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[var(--color-text-muted)] shrink-0">
                      You {p.you}% · Mkt {p.mkt}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-6 py-14 max-w-lg mx-auto w-full flex flex-col gap-7 border-t border-[var(--color-border)]">
        <h2 className="text-2xl font-display font-black tracking-tight">How it works</h2>
        <div className="flex flex-col gap-6">
          {HOW_IT_WORKS.map(({ n, title, desc }) => (
            <div key={n} className="flex gap-5">
              <span className="font-display font-black text-4xl text-[var(--color-brand-primary)] opacity-30 leading-none shrink-0 w-12 pt-0.5">
                {n}
              </span>
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-bold text-[var(--color-text-primary)]">{title}</p>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 py-14 max-w-lg mx-auto w-full flex flex-col gap-7 border-t border-[var(--color-border)]">
        <h2 className="text-2xl font-display font-black tracking-tight">Built to make you sharper</h2>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map(({ title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4 flex flex-col gap-2 hover:border-[var(--color-brand-primary)]/40 transition-colors"
            >
              <p className="text-sm font-bold text-[var(--color-text-primary)]">{title}</p>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Season 1 CTA ── */}
      <section className="px-6 py-14 max-w-lg mx-auto w-full border-t border-[var(--color-border)]">
        <div className="rounded-2xl border-2 border-[var(--color-brand-primary)] bg-gradient-to-br from-[var(--color-surface-1)] to-[var(--color-surface-2)] p-8 flex flex-col gap-5 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at top left, #ff3c3c 0%, transparent 60%)" }}
          />
          <div className="relative flex flex-col gap-3">
            <p className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest">
              Season 1 Prize Pool
            </p>
            <p className="text-7xl font-display font-black text-[var(--color-brand-primary)] tracking-tight leading-none">
              $25K
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Top forecasters split the pool at season end.
              Free to enter. Ranked by calibration score — not luck.
            </p>
            <Link
              href="/learn"
              className="mt-2 w-full text-center px-6 py-4 rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-base hover:bg-red-500 transition-all hover:shadow-[0_0_24px_rgba(255,60,60,0.4)] active:scale-[0.98]"
            >
              Start predicting free
            </Link>
            <p className="text-xs text-center text-[var(--color-text-muted)]">
              No credit card. No real money at risk.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--color-border)] px-6 py-10 mt-auto">
        <div className="max-w-lg mx-auto flex flex-col gap-3">
          <span className="font-display font-black text-sm tracking-tight text-[var(--color-text-primary)]">
            Forecast
          </span>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed max-w-sm">
            A calibration-based forecasting competition. Not a sportsbook.
            Prizes are company-funded incentives, not player stakes.
          </p>
          <div className="flex gap-5 pt-1">
            <Link href="/learn" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Practice Mode</Link>
            <Link href="/card" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Tonight&apos;s Card</Link>
            <Link href="/leaderboard" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Leaderboard</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
