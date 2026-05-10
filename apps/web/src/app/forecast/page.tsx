import Link from "next/link";
import { AuthCta } from "@/components/auth-cta";

export const metadata = {
  title: "Forecast — The Card",
  openGraph: { images: [{ url: "/forecast/og.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image" as const, images: ["/forecast/og.png"] },
};

const SPORTS = ["NFL", "NBA", "MLB", "NHL", "UFC", "Soccer", "Tennis", "Golf"];

const MOCK_QUESTIONS = [
  { sport: "NFL", question: "Chiefs to win Super Bowl LX", crowd: 62 },
  { sport: "NBA", question: "LeBron scores 30+ tonight", crowd: 38 },
  { sport: "UFC", question: "Jones retains heavyweight title", crowd: 71 },
];

const MOCK_LEADERBOARD = [
  { rank: 1, name: "SharpScott",   score: 87, predictions: 142 },
  { rank: 2, name: "MarketMike",   score: 84, predictions:  98 },
  { rank: 3, name: "CalibKing",    score: 81, predictions: 203 },
];

const STEPS = [
  {
    n: "01",
    title: "Pick any question",
    desc: "NFL, NBA, MLB, NHL, UFC, soccer — new markets every day across every major sport.",
  },
  {
    n: "02",
    title: "Set your probability",
    desc: "Not just YES or NO. Say 73%. That precision is exactly what gets measured.",
  },
  {
    n: "03",
    title: "Get your Brier score",
    desc: "Calibration scoring tells you whether your 70% calls actually land 70% of the time. Most people are shocked.",
  },
  {
    n: "04",
    title: "Climb the leaderboard",
    desc: "Seasonal rankings. The sharpest forecasters at the end of the season split the prize pool.",
  },
];

const FEATURES = [
  {
    title: "Every major sport",
    desc: "NFL, NBA, MLB, NHL, UFC, soccer, tennis, golf, and more. Not curated to ten — the whole board.",
  },
  {
    title: "Calibration scoring",
    desc: "Brier score measures precision over time. Win rate doesn't matter — accuracy at stated confidence does.",
  },
  {
    title: "Seasonal prizes",
    desc: "Company-funded prize pool. Top forecasters win real money. No entry fee, no user stakes.",
  },
  {
    title: "Free to play",
    desc: "Daily forecasting is free. Premium unlocks advanced calibration breakdowns and analytics.",
  },
];

const FOOTER_LINKS = [
  { href: "/card", label: "Tonight's Card" },
  { href: "/live", label: "Live" },
  { href: "/blitz", label: "Blitz" },
  { href: "/h2h", label: "Head-to-Head" },
  { href: "/forecast", label: "Forecast" },
  { href: "/perfect-ten", label: "Perfect 10" },
  { href: "/leagues", label: "Leagues" },
  { href: "/sports-calendar", label: "Sports Calendar" },
  { href: "/picks", label: "Picks" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-surface-0)] text-[var(--color-text-primary)]">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface-0)]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <span className="font-display font-black text-xl tracking-tight">
          Forecast
        </span>
        <AuthCta
          href="/card"
          signedOutLabel="Sign in"
          signedInLabel="Start"
          className="text-sm font-bold px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-brand-primary)]/50 transition-all"
        />
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-6 py-16 flex flex-col gap-10 max-w-lg mx-auto w-full">
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #ff3c3c 0%, transparent 70%)" }}
        />

        <div className="relative flex flex-col gap-5">
          <div className="flex flex-wrap gap-1.5">
            {SPORTS.map((s) => (
              <span
                key={s}
                className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] bg-[var(--color-surface-1)]"
              >
                {s}
              </span>
            ))}
          </div>

          <h1 className="text-5xl font-display font-black tracking-tight leading-[0.95]">
            Not picks.<br />
            <span className="text-[var(--color-brand-primary)]">Probabilities.</span>
          </h1>

          <p className="text-base text-[var(--color-text-secondary)] leading-relaxed max-w-sm">
            Forecast is a free daily prediction game. Assign probabilities to real sports outcomes,
            get scored on precision — not just direction — and compete for seasonal prizes.
          </p>

          <div className="flex gap-3 pt-1 flex-wrap">
            <AuthCta
              href="/card"
              signedOutLabel="Start Predicting Free ->"
              signedInLabel="Start Predicting Free ->"
              className="px-6 py-3 rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-sm hover:bg-red-500 transition-all hover:shadow-[0_0_24px_rgba(255,60,60,0.4)] active:scale-95"
            />
            <Link
              href="/leaderboard"
              className="px-6 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold text-sm hover:border-[var(--color-brand-primary)]/50 hover:text-[var(--color-text-primary)] transition-all"
            >
              See the Leaderboard
            </Link>
          </div>
        </div>

        {/* Mock prediction feed */}
        <div className="relative flex flex-col gap-2">
          <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1">
            Live now
          </p>
          {MOCK_QUESTIONS.map(({ sport, question, crowd }) => (
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
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-[var(--color-text-muted)]">
                  Crowd: <span className="font-bold text-[var(--color-text-primary)]">{crowd}%</span>
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg border border-[var(--color-border)] text-[var(--color-brand-primary)]">
                  Predict
                </span>
              </div>
            </div>
          ))}
          <p className="text-xs text-[var(--color-text-muted)] text-right pt-1">
            + hundreds more across every sport
          </p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-6 py-14 max-w-lg mx-auto w-full flex flex-col gap-7 border-t border-[var(--color-border)]">
        <h2 className="text-2xl font-display font-black tracking-tight">How it works</h2>
        <div className="flex flex-col gap-6">
          {STEPS.map(({ n, title, desc }) => (
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
        <h2 className="text-2xl font-display font-black tracking-tight">Built different</h2>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map(({ title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4 flex flex-col gap-2 hover:border-[var(--color-brand-primary)]/40 transition-colors"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-primary)]" />
              <p className="text-sm font-bold text-[var(--color-text-primary)]">{title}</p>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Leaderboard preview ── */}
      <section className="px-6 py-14 max-w-lg mx-auto w-full border-t border-[var(--color-border)] flex flex-col gap-7">
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
            <span className="text-right">Score</span>
          </div>
          {MOCK_LEADERBOARD.map(({ rank, name, score, predictions }) => (
            <div
              key={rank}
              className="grid grid-cols-4 px-4 py-3 border-b border-[var(--color-border)] last:border-0 items-center"
            >
              <span className="text-sm font-black text-[var(--color-text-muted)]">{rank}</span>
              <div className="col-span-2 flex flex-col">
                <span className="text-sm font-bold text-[var(--color-text-primary)]">{name}</span>
                <span className="text-[10px] text-[var(--color-text-muted)]">{predictions} predictions</span>
              </div>
              <span
                className="text-right text-sm font-black"
                style={{ color: score >= 85 ? "var(--color-success)" : score >= 70 ? "var(--color-warning)" : "var(--color-text-primary)" }}
              >
                {score}
              </span>
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
              Season 1 — NFL through Super Bowl
            </p>
            <p className="text-7xl font-display font-black text-[var(--color-brand-primary)] tracking-tight leading-none">
              $25K
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Company-funded prize pool. The sharpest forecasters at season end split it.
              No buy-in. No user stakes. Just prove you&apos;re sharp.
            </p>
            <AuthCta
              href="/card"
              signedOutLabel="Start Predicting Free ->"
              signedInLabel="Start Predicting Free ->"
              className="mt-2 w-full text-center px-6 py-4 rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-base hover:bg-red-500 transition-all hover:shadow-[0_0_24px_rgba(255,60,60,0.4)] active:scale-[0.98]"
            />
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
            Not a sportsbook. Not gambling. A free forecasting competition scored on
            calibration — the same method used by professional analysts and superforecasters.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}
