import Link from "next/link";

const MOCK_MARKETS = [
  { sport: "NFL", question: "Mahomes throws 2+ touchdown passes", yes: 68, no: 32 },
  { sport: "NBA", question: "LeBron scores 30+ points tonight", yes: 41, no: 59 },
  { sport: "UFC", question: "Jones retains heavyweight title Saturday", yes: 74, no: 26 },
  { sport: "MLB", question: "Dodgers win tonight at home", yes: 57, no: 43 },
  { sport: "NHL", question: "Ovechkin scores in tonight's game", yes: 33, no: 67 },
];

const MOCK_LEADERS = [
  { rank: 1, name: "SharpScott", record: "38–14", hot: true },
  { rank: 2, name: "MarketMike", record: "31–12", hot: false },
  { rank: 3, name: "CalibKing",  record: "52–22", hot: false },
];

const SURFACES = [
  {
    href: "/card",
    emoji: "🎴",
    label: "Tonight's Card",
    desc: "Ten curated markets. One host take each. Live odds that move as bets come in.",
  },
  {
    href: "/live",
    emoji: "⚡",
    label: "Live",
    desc: "Pick a game and go deep. Micromarkets pop up in real time as the action unfolds.",
  },
  {
    href: "/learn",
    emoji: "📚",
    label: "Practice",
    desc: "Predict for free. Real calibration tracking — no money at risk.",
  },
  {
    href: "/picks",
    emoji: "🎯",
    label: "Picks",
    desc: "AI agents that trade on your behalf. Set a budget cap and let them run. Coming soon.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-surface-0)] text-[var(--color-text-primary)]">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface-0)]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <span className="font-display font-black text-xl tracking-tight text-[var(--color-text-primary)]">
          The Card
        </span>
        <Link
          href="/card"
          className="text-sm font-black px-4 py-2 rounded-lg bg-[var(--color-brand-primary)] text-white hover:bg-red-500 transition-all active:scale-95"
        >
          Enter →
        </Link>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-6 pt-16 pb-12 flex flex-col gap-8 max-w-lg mx-auto w-full">
        {/* Glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl opacity-[0.08] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, #ff3c3c 0%, transparent 65%)" }}
        />

        <div className="relative flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-brand-primary)] animate-pulse" />
            <span className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest">
              Live now
            </span>
          </div>

          <h1 className="text-6xl font-display font-black tracking-tight leading-[0.9]">
            Tonight&apos;s<br />
            <span className="text-[var(--color-brand-primary)]">Card.</span>
          </h1>

          <p className="text-base text-[var(--color-text-secondary)] leading-relaxed max-w-xs">
            Ten markets. Live odds. One host take on each.
            Sports prediction the way it should feel — fast, opinionated, fan-first.
          </p>

          <div className="flex gap-3 flex-wrap pt-1">
            <Link
              href="/card"
              className="px-6 py-3.5 rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-sm hover:bg-red-500 transition-all hover:shadow-[0_0_28px_rgba(255,60,60,0.45)] active:scale-95"
            >
              Open Tonight&apos;s Card →
            </Link>
            <Link
              href="/leaderboard"
              className="px-6 py-3.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold text-sm hover:border-[var(--color-brand-primary)]/50 hover:text-[var(--color-text-primary)] transition-all"
            >
              Leaderboard
            </Link>
          </div>
        </div>

        {/* Live market feed */}
        <div className="relative flex flex-col gap-2">
          <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-1">
            Markets on The Card now
          </p>
          {MOCK_MARKETS.map(({ sport, question, yes, no }) => (
            <div
              key={question}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] px-4 py-3 flex items-center gap-3"
            >
              <span className="text-[10px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest shrink-0 w-8">
                {sport}
              </span>
              <p className="flex-1 text-sm font-semibold text-[var(--color-text-primary)] leading-snug min-w-0 truncate">
                {question}
              </p>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-black text-[var(--color-success)] px-2 py-1 rounded-md bg-[var(--color-success-dim)]">
                  YES {yes}¢
                </span>
                <span className="text-[11px] font-black text-[var(--color-danger)] px-2 py-1 rounded-md bg-[var(--color-danger-dim)]">
                  NO {no}¢
                </span>
              </div>
            </div>
          ))}
          <p className="text-xs text-[var(--color-text-muted)] text-right pt-1">
            + 5 more on tonight&apos;s card
          </p>
        </div>
      </section>

      {/* ── Jackpot ── */}
      <section className="px-6 py-6 max-w-lg mx-auto w-full">
        <div className="rounded-2xl border-2 border-[var(--color-brand-primary)] bg-gradient-to-br from-[var(--color-surface-1)] to-[var(--color-surface-2)] p-7 flex flex-col gap-3 relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{ background: "radial-gradient(ellipse at top left, #ff3c3c 0%, transparent 60%)" }}
          />
          <p className="relative text-[10px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest">
            Perfect 10 — Rolling Jackpot
          </p>
          <p className="relative text-7xl font-display font-black text-[var(--color-brand-primary)] tracking-tight leading-none">
            $42,000
          </p>
          <p className="relative text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-xs">
            Hit all ten markets on tonight&apos;s card and split the jackpot.
            Nobody&apos;s done it in two weeks. It keeps growing.
          </p>
          <Link
            href="/card"
            className="relative mt-1 w-full text-center px-6 py-4 rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-base hover:bg-red-500 transition-all hover:shadow-[0_0_28px_rgba(255,60,60,0.45)] active:scale-[0.98]"
          >
            Enter Tonight&apos;s Card →
          </Link>
        </div>
      </section>

      {/* ── Four surfaces ── */}
      <section className="px-6 py-14 max-w-lg mx-auto w-full flex flex-col gap-6 border-t border-[var(--color-border)]">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-display font-black tracking-tight">Everything on The Card</h2>
          <p className="text-sm text-[var(--color-text-muted)]">One app. Four ways to play.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {SURFACES.map(({ href, emoji, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4 flex flex-col gap-2.5 hover:border-[var(--color-brand-primary)]/40 hover:bg-[var(--color-surface-2)] transition-all active:scale-[0.98]"
            >
              <span className="text-2xl leading-none">{emoji}</span>
              <p className="text-sm font-black text-[var(--color-text-primary)]">{label}</p>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Leaderboard preview ── */}
      <section className="px-6 py-14 max-w-lg mx-auto w-full border-t border-[var(--color-border)] flex flex-col gap-6">
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-2xl font-display font-black tracking-tight">This week&apos;s sharp</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Ranked by win rate, weighted by calibration</p>
          </div>
          <Link href="/leaderboard" className="text-xs font-black text-[var(--color-brand-primary)] hover:underline">
            Full board →
          </Link>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] overflow-hidden">
          {MOCK_LEADERS.map(({ rank, name, record, hot }) => (
            <div
              key={rank}
              className="flex items-center gap-4 px-4 py-3.5 border-b border-[var(--color-border)] last:border-0"
            >
              <span className="text-sm font-black text-[var(--color-text-muted)] w-5 shrink-0">{rank}</span>
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <span className="text-sm font-bold text-[var(--color-text-primary)] truncate">{name}</span>
                {hot && (
                  <span className="text-[10px] font-black text-[var(--color-brand-primary)] px-1.5 py-0.5 rounded-md border border-[var(--color-brand-primary)]/40 bg-[var(--color-brand-dim)] shrink-0">
                    HOT
                  </span>
                )}
              </div>
              <span className="text-sm font-black text-[var(--color-text-secondary)] shrink-0">{record}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── What it is ── */}
      <section className="px-6 py-14 max-w-lg mx-auto w-full border-t border-[var(--color-border)] flex flex-col gap-5">
        <h2 className="text-2xl font-display font-black tracking-tight">Not a sportsbook.</h2>
        <div className="flex flex-col gap-4 text-sm text-[var(--color-text-secondary)] leading-relaxed">
          <p>
            The Card is a prediction market. You buy YES or NO contracts on real outcomes at live prices.
            If you&apos;re right, you get paid. The price <em>is</em> the crowd&apos;s forecast — not set by a house.
          </p>
          <p>
            No house edge. No juice. The market price reflects exactly what bettors think will happen,
            updated live as money comes in on both sides.
          </p>
          <p className="text-[var(--color-text-muted)]">
            Real-money settlement via Kalshi&apos;s regulated US exchange — launching soon.
            Practice free on The Card today to get your edge before the stakes are live.
          </p>
        </div>
        <Link
          href="/card"
          className="mt-2 inline-flex items-center gap-2 text-sm font-black text-[var(--color-brand-primary)] hover:underline"
        >
          Open Tonight&apos;s Card →
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--color-border)] px-6 py-10 mt-auto">
        <div className="max-w-lg mx-auto flex flex-col gap-3">
          <span className="font-display font-black text-sm tracking-tight">The Card</span>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed max-w-sm">
            Fan-first sports prediction. Ten markets. Live odds. One jackpot.
            Markets powered by Kalshi&apos;s regulated US exchange.
          </p>
          <div className="flex flex-wrap gap-5 pt-1">
            <Link href="/card"        className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Tonight&apos;s Card</Link>
            <Link href="/live"        className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Live</Link>
            <Link href="/learn"       className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Practice</Link>
            <Link href="/picks"       className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Picks</Link>
            <Link href="/leaderboard" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Leaderboard</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
