import Link from "next/link";

const LIVE_MARKETS = [
  { sport: "NFL",    question: "Chiefs cover the spread tonight",     yes: 58, no: 42 },
  { sport: "NBA",    question: "LeBron drops 30+ vs the Celtics",     yes: 44, no: 56 },
  { sport: "UFC",    question: "Jones retains the heavyweight title",  yes: 71, no: 29 },
  { sport: "MLB",    question: "Dodgers win Game 3",                  yes: 62, no: 38 },
  { sport: "NHL",    question: "Ovechkin scores tonight",             yes: 37, no: 63 },
];

const SURFACES = [
  {
    emoji: "🎴",
    href: "/card",
    label: "Tonight's Card",
    desc: "Ten curated markets every night. Live odds, host take on each, one clean feed.",
  },
  {
    emoji: "⚡",
    href: "/live",
    label: "Live",
    desc: "Pick a game and go deep. Real-time markets updating play by play.",
  },
  {
    emoji: "📚",
    href: "/learn",
    label: "Practice Mode",
    desc: "Same markets, no money at risk. Build your track record before betting real.",
  },
  {
    emoji: "🎯",
    href: "/picks",
    label: "Picks",
    desc: "Coming soon — rent a verified forecaster or let an AI agent trade for you.",
  },
];

const LEADERBOARD = [
  { rank: 1, name: "SharpScott",  w: 14, l: 3,  pct: 82 },
  { rank: 2, name: "MarketMike",  w: 11, l: 4,  pct: 73 },
  { rank: 3, name: "CalibKing",   w: 19, l: 8,  pct: 70 },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-surface-0)] text-[var(--color-text-primary)]">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface-0)]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <span className="font-display font-black text-xl tracking-tight">
          The Card
        </span>
        <Link
          href="/card"
          className="text-sm font-bold px-4 py-2 rounded-lg bg-[var(--color-brand-primary)] text-white hover:bg-red-500 transition-all"
        >
          Enter →
        </Link>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-6 py-16 flex flex-col gap-10 max-w-lg mx-auto w-full">
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #ff3c3c 0%, transparent 70%)" }}
        />

        <div className="relative flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-brand-primary)] animate-pulse" />
            <span className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest">
              Live Now
            </span>
          </div>

          <h1 className="text-6xl font-display font-black tracking-tight leading-[0.9]">
            Tonight&apos;s<br />
            <span className="text-[var(--color-brand-primary)]">Card.</span>
          </h1>

          <p className="text-base text-[var(--color-text-secondary)] leading-relaxed max-w-sm">
            Sports prediction markets for fans, not traders. Ten live markets every night.
            Pick sides, watch odds move, compete for the jackpot.
          </p>

          <div className="flex gap-3 flex-wrap">
            <Link
              href="/card"
              className="px-6 py-3 rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-sm hover:bg-red-500 transition-all hover:shadow-[0_0_24px_rgba(255,60,60,0.4)] active:scale-95"
            >
              Tonight&apos;s Card →
            </Link>
            <Link
              href="/leaderboard"
              className="px-6 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold text-sm hover:border-[var(--color-brand-primary)]/50 hover:text-[var(--color-text-primary)] transition-all"
            >
              Leaderboard
            </Link>
          </div>
        </div>

        {/* Live market feed preview */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1">
            Tonight&apos;s markets
          </p>
          {LIVE_MARKETS.map(({ sport, question, yes, no }) => (
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
              <div className="flex gap-1.5 shrink-0">
                <span className="text-xs font-black px-2 py-1 rounded-md bg-[var(--color-success-dim)] text-[var(--color-success)]">
                  {yes}¢
                </span>
                <span className="text-xs font-black px-2 py-1 rounded-md bg-[var(--color-danger-dim)] text-[var(--color-danger)]">
                  {no}¢
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
      <section className="px-6 max-w-lg mx-auto w-full">
        <div className="rounded-2xl border-2 border-[var(--color-brand-primary)] bg-gradient-to-br from-[var(--color-surface-1)] to-[var(--color-surface-2)] p-8 flex flex-col gap-3 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at top left, #ff3c3c 0%, transparent 60%)" }}
          />
          <p className="relative text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest">
            Perfect 10 — Rolling Jackpot
          </p>
          <p className="relative text-7xl font-display font-black text-[var(--color-brand-primary)] tracking-tight leading-none">
            $42K
          </p>
          <p className="relative text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-xs">
            Call all ten markets right and you split it. It&apos;s been rolling for two weeks.
            Nobody&apos;s hit it yet.
          </p>
          <Link
            href="/card"
            className="relative mt-2 w-full text-center px-6 py-4 rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-base hover:bg-red-500 transition-all hover:shadow-[0_0_24px_rgba(255,60,60,0.4)] active:scale-[0.98]"
          >
            Make Your Picks →
          </Link>
        </div>
      </section>

      {/* ── Four surfaces ── */}
      <section className="px-6 py-14 max-w-lg mx-auto w-full flex flex-col gap-6 border-t border-[var(--color-border)] mt-14">
        <h2 className="text-2xl font-display font-black tracking-tight">One app, four ways to play</h2>
        <div className="grid grid-cols-2 gap-3">
          {SURFACES.map(({ emoji, href, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4 flex flex-col gap-2 hover:border-[var(--color-brand-primary)]/50 hover:bg-[var(--color-surface-2)] transition-all"
            >
              <span className="text-2xl leading-none">{emoji}</span>
              <p className="text-sm font-bold text-[var(--color-text-primary)]">{label}</p>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Leaderboard preview ── */}
      <section className="px-6 py-14 max-w-lg mx-auto w-full border-t border-[var(--color-border)] flex flex-col gap-6">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-display font-black tracking-tight">The leaderboard</h2>
          <Link href="/leaderboard" className="text-xs font-bold text-[var(--color-brand-primary)] hover:underline">
            See all →
          </Link>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] overflow-hidden">
          <div className="grid grid-cols-4 px-4 py-2 border-b border-[var(--color-border)] text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
            <span>#</span>
            <span className="col-span-2">Forecaster</span>
            <span className="text-right">Win %</span>
          </div>
          {LEADERBOARD.map(({ rank, name, w, l, pct }) => (
            <div
              key={rank}
              className="grid grid-cols-4 px-4 py-3 border-b border-[var(--color-border)] last:border-0 items-center"
            >
              <span className="text-sm font-black text-[var(--color-text-muted)]">{rank}</span>
              <div className="col-span-2 flex flex-col">
                <span className="text-sm font-bold text-[var(--color-text-primary)]">{name}</span>
                <span className="text-[10px] text-[var(--color-text-muted)]">{w}W – {l}L</span>
              </div>
              <span className="text-right text-sm font-black text-[var(--color-success)]">
                {pct}%
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--color-border)] px-6 py-10 mt-auto">
        <div className="max-w-lg mx-auto flex flex-col gap-3">
          <span className="font-display font-black text-sm tracking-tight">The Card</span>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed max-w-sm">
            Sports prediction markets for fans. Real markets, live odds, no house edge.
            Powered by Kalshi&apos;s regulated exchange.
          </p>
          <div className="flex gap-5 pt-1 flex-wrap">
            <Link href="/card"        className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Tonight&apos;s Card</Link>
            <Link href="/live"        className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Live</Link>
            <Link href="/learn"       className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Practice Mode</Link>
            <Link href="/leaderboard" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Leaderboard</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
