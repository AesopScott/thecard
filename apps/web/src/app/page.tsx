"use client";

import Link from "next/link";
import { AuthCta } from "@/components/auth-cta";
import { HomeTour } from "@/components/home-tour";
import { ScoutFloaters } from "@/components/scout-mascot";
import { useI18n } from "@/contexts/i18n-context";
import { VERSION } from "@/lib/version";

const LIVE_MARKETS = [
  { sport: "NFL",    question: "Chiefs cover the spread tonight",     yes: 58, no: 42, time: "8:20 PM ET", logo: "🏈" },
  { sport: "NBA",    question: "LeBron drops 30+ vs the Celtics",     yes: 44, no: 56, time: "7:30 PM ET", logo: "🏀" },
  { sport: "UFC",    question: "Jones retains the heavyweight title",  yes: 71, no: 29, time: "10:00 PM ET", logo: "🥊" },
  { sport: "MLB",    question: "Dodgers win Game 3",                  yes: 62, no: 38, time: "9:08 PM ET", logo: "⚾" },
  { sport: "NHL",    question: "Ovechkin scores tonight",             yes: 37, no: 63, time: "7:00 PM ET", logo: "🏒" },
];

const UPCOMING_EVENTS = [
  { sport: "NFL", matchup: "49ers vs Eagles", date: "May 12", time: "8:20 PM", icon: "🏈" },
  { sport: "NBA", matchup: "Celtics vs Suns", date: "May 13", time: "9:00 PM", icon: "🏀" },
  { sport: "MLB", matchup: "Dodgers vs Yankees", date: "May 14", time: "7:05 PM", icon: "⚾" },
  { sport: "NHL", matchup: "Avalanche vs Stars", date: "May 15", time: "8:30 PM", icon: "🏒" },
];

const SURFACES = [
  {
    emoji: "🎴",
    href: "/card",
    label: "Tonight's Card",
    desc: "Curated markets every night. Live odds, host take on each, one clean feed.",
  },
  {
    emoji: "⚡",
    href: "/live",
    label: "Live",
    desc: "Pick a game and go deep. Real-time markets updating play by play.",
  },
  {
    emoji: "🔥",
    href: "/blitz",
    label: "Blitz",
    desc: "5 markets, 15 seconds each. Speed bonus for fast picks. Daily reset.",
  },
  {
    emoji: "🥊",
    href: "/h2h",
    label: "Head-to-Head",
    desc: "You vs a verified forecaster. Same 5 markets, no timer. Most right wins.",
  },
  {
    emoji: "🎯",
    href: "/forecast",
    label: "Forecast",
    desc: "Build your calibration record. Predict outcomes, track your accuracy over time.",
  },
];

const LEADERBOARD = [
  { rank: 1, name: "SharpScott",  w: 14, l: 3,  pct: 82 },
  { rank: 2, name: "MarketMike",  w: 11, l: 4,  pct: 73 },
  { rank: 3, name: "CalibKing",   w: 19, l: 8,  pct: 70 },
];

const FOOTER_LINKS = [
  { href: "/card", label: "Tonight's Card" },
  { href: "/live", label: "Live" },
  { href: "/blitz", label: "Blitz" },
  { href: "/h2h", label: "Head-to-Head" },
  { href: "/forecast", label: "Forecast" },
  { href: "/world-cup", label: "World Cup" },
  { href: "/perfect-ten", label: "Perfect 10" },
  { href: "/leagues", label: "Leagues" },
  { href: "/sports-calendar", label: "Sports Calendar" },
  { href: "/league-pass", label: "League Pass" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/support", label: "Support" },
];

export default function LandingPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-surface-0)] text-[var(--color-text-primary)] relative overflow-hidden">
      <HomeTour />
      <ScoutFloaters page="home" />
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface-0)]/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <span className="font-display font-black text-xl tracking-tight">
          The Card
        </span>
        <AuthCta
          href="/card"
          signedOutLabel={t("account.signIn")}
          signedInLabel={t("home.ctaCard")}
          className="text-sm font-bold px-4 py-2 rounded-lg bg-[var(--color-brand-primary)] text-white hover:bg-red-500 transition-all hover:shadow-lg hover:scale-105"
        />
      </header>

      {/* ── Main Content Grid ── */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">

          {/* Left Sidebar - Upcoming Events */}
          <aside className="lg:col-span-1 order-3 lg:order-1">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-surface-1)] to-[var(--color-surface-2)] p-5 space-y-4 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none opacity-40" style={{ background: "linear-gradient(135deg, transparent 0%, rgba(255,60,60,0.25) 50%, transparent 100%)", animation: "breathe 8s ease-in-out infinite" }} />
                <div className="relative z-10">
                  <h3 className="text-sm font-black text-[var(--color-brand-primary)] uppercase tracking-widest">{t("home.upcoming")}</h3>
                  <div className="space-y-3">
                    {UPCOMING_EVENTS.map(({ sport, matchup, date, time, icon }, i) => (
                      <div
                        key={matchup}
                        className="rounded-lg bg-[var(--color-surface-0)] border border-[var(--color-border)] p-3 hover:border-[var(--color-brand-primary)]/50 transition-all hover:translate-x-1 cursor-pointer"
                        style={{
                          animation: `slideInLeft 0.5s ease-out ${i * 0.1}s both`,
                        }}
                      >
                        <div className="text-2xl mb-2">{icon}</div>
                        <p className="text-xs font-bold text-[var(--color-brand-primary)] uppercase">{sport}</p>
                        <p className="text-xs font-semibold text-[var(--color-text-primary)] line-clamp-2 mt-1">{matchup}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)] mt-2">{date} • {time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Center - Hero & Markets */}
          <div className="lg:col-span-2 order-1 lg:order-2 space-y-8">

            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-surface-1)] via-[var(--color-surface-0)] to-[var(--color-surface-1)] p-8 sm:p-12">
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at 50% 0%, #ff3c3c 0%, transparent 80%)",
                  animation: "pulse 4s ease-in-out infinite",
                }}
              />
              <div className="absolute top-0 right-0 w-96 h-96 opacity-5 pointer-events-none" style={{
                background: "radial-gradient(circle, #ff3c3c 0%, transparent 70%)",
              }} />

              <div className="relative space-y-6">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[var(--color-brand-primary)] animate-pulse" />
                  <span className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest">
                    {t("home.liveNow")}
                  </span>
                </div>

                <div>
                  <h1 className="text-5xl sm:text-7xl font-display font-black tracking-tight leading-[0.95] mb-4">
                    Tonight&apos;s<br />
                    <span className="text-[var(--color-brand-primary)] drop-shadow-lg">Card.</span>
                  </h1>
                  <p className="text-base text-[var(--color-text-secondary)] leading-relaxed max-w-md">
                    {t("home.heroBody")}
                  </p>
                </div>

                <div className="flex gap-3 flex-wrap pt-2">
                  <Link
                    href="/card"
                    className="px-6 py-3 rounded-xl bg-[var(--color-brand-primary)] text-white font-black text-sm hover:bg-red-500 transition-all hover:shadow-[0_0_32px_rgba(255,60,60,0.5)] active:scale-95 animate-bounce"
                    style={{ animation: "bounce 2s infinite" }}
                  >
                    {t("home.ctaCard")}
                  </Link>
                  <Link
                    href="/leaderboard"
                    className="px-6 py-3 rounded-xl border-2 border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] font-bold text-sm hover:bg-[var(--color-brand-primary)]/10 transition-all"
                  >
                    {t("home.ctaLeaderboard")}
                  </Link>
                </div>
              </div>
            </section>

            {/* Live Markets */}
            <section className="space-y-3">
              <h2 className="text-lg font-display font-black tracking-tight">{t("home.markets")}</h2>
              <div className="space-y-2">
                {LIVE_MARKETS.map(({ sport, question, yes, no, time, logo }, i) => (
                  <div
                    key={question}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] hover:bg-[var(--color-surface-2)] px-4 py-3 flex items-center gap-3 hover:border-[var(--color-brand-primary)]/50 transition-all hover:shadow-lg cursor-pointer group"
                    style={{
                      animation: `slideInUp 0.5s ease-out ${i * 0.08}s both`,
                    }}
                  >
                    <span className="text-xl group-hover:animate-bounce">{logo}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest">
                        {sport}
                      </p>
                      <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                        {question}
                      </p>
                      <p className="text-[9px] text-[var(--color-text-muted)] mt-0.5">{time}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <div className="text-center">
                        <div className="text-xs font-black px-2 py-1 rounded-md bg-[var(--color-success-dim)] text-[var(--color-success)]">
                          {yes}¢
                        </div>
                        <p className="text-[7px] text-[var(--color-text-muted)] mt-0.5">YES</p>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-black px-2 py-1 rounded-md bg-[var(--color-danger-dim)] text-[var(--color-danger)]">
                          {no}¢
                        </div>
                        <p className="text-[7px] text-[var(--color-text-muted)] mt-0.5">NO</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Sidebar - Jackpot & Stats */}
          <aside className="lg:col-span-1 order-2 lg:order-3">
            <div className="sticky top-24 space-y-4">
              {/* Jackpot */}
              <div className="rounded-2xl border-2 border-[var(--color-brand-primary)] bg-gradient-to-br from-[var(--color-surface-1)] to-[var(--color-surface-2)] p-6 space-y-3 relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse at top left, #ff3c3c 0%, transparent 60%)" }}
                />
                <div className="absolute inset-0 pointer-events-none opacity-40" style={{ background: "linear-gradient(135deg, transparent 0%, rgba(255,60,60,0.25) 50%, transparent 100%)", animation: "breathe 8s ease-in-out infinite" }} />
                <div className="relative">
                  <p className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest">
                    🏆 Perfect 10
                  </p>
                  <p className="text-5xl font-display font-black text-[var(--color-brand-primary)] tracking-tight leading-none mt-2" style={{
                    animation: "pulse 2s ease-in-out infinite",
                  }}>
                    $42K
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-snug mt-3">
                    {t("home.jackpotBody")}
                  </p>
                  <Link
                    href="/card"
                    className="relative mt-3 w-full block text-center px-4 py-2 rounded-lg bg-[var(--color-brand-primary)] text-white font-bold text-xs hover:bg-red-500 transition-all hover:shadow-[0_0_20px_rgba(255,60,60,0.4)] active:scale-[0.98]"
                  >
                    Make Picks →
                  </Link>
                </div>
              </div>

              {/* Top Forecaster */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5 space-y-3">
                <p className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest">{t("home.topForecaster")}</p>
                <div className="space-y-2">
                  {LEADERBOARD.slice(0, 1).map(({ name, w, l, pct }) => (
                    <div key={name} className="space-y-1">
                      <p className="text-sm font-bold text-[var(--color-text-primary)]">{name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{w}W – {l}L</p>
                      <div className="w-full bg-[var(--color-surface-2)] rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[var(--color-success)] to-[var(--color-brand-primary)] rounded-full"
                          style={{
                            width: `${pct}%`,
                            animation: "slideRight 1s ease-out",
                          }}
                        />
                      </div>
                      <p className="text-xs font-black text-[var(--color-success)]">{pct}% Win Rate</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ── Five Surfaces ── */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 border-t border-[var(--color-border)] relative">
        <div className="absolute inset-0 pointer-events-none opacity-20" style={{ background: "linear-gradient(135deg, transparent 0%, rgba(255,60,60,0.15) 50%, transparent 100%)", animation: "breathe 8s ease-in-out infinite" }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <h2 className="text-2xl font-display font-black tracking-tight mb-6">{t("home.surfacesHeading")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {SURFACES.map(({ emoji, href, label, desc }, i) => (
              <Link
                key={href}
                href={href}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5 flex flex-col gap-3 hover:border-[var(--color-brand-primary)]/50 hover:bg-[var(--color-surface-2)] transition-all hover:shadow-lg hover:scale-105 hover:-translate-y-1"
                style={{
                  animation: `slideInUp 0.5s ease-out ${i * 0.1}s both`,
                }}
              >
                <span className="text-4xl leading-none">{emoji}</span>
                <p className="text-sm font-bold text-[var(--color-text-primary)]">{label}</p>
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Leaderboard ── */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 border-t border-[var(--color-border)] relative">
        <div className="absolute inset-0 pointer-events-none opacity-20" style={{ background: "linear-gradient(135deg, transparent 0%, rgba(255,60,60,0.15) 50%, transparent 100%)", animation: "breathe 8s ease-in-out infinite" }} />
        <div className="max-w-7xl mx-auto relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl font-display font-black tracking-tight">{t("home.leaderboardHeading")}</h2>
            <Link href="/leaderboard" className="text-xs font-bold text-[var(--color-brand-primary)] hover:underline">
              See all →
            </Link>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] overflow-hidden">
            <div className="grid grid-cols-4 px-4 py-2 border-b border-[var(--color-border)] text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              <span>#</span>
              <span className="col-span-2">{t("home.forecaster")}</span>
              <span className="text-right">{t("home.winPercent")}</span>
            </div>
            {LEADERBOARD.map(({ rank, name, w, l, pct }, i) => (
              <div
                key={rank}
                className="grid grid-cols-4 px-4 py-3 border-b border-[var(--color-border)] last:border-0 items-center hover:bg-[var(--color-surface-2)] transition-all"
                style={{
                  animation: `slideInLeft 0.5s ease-out ${i * 0.1}s both`,
                }}
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
        </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--color-border)] px-4 sm:px-6 lg:px-8 py-10 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          <span className="font-display font-black text-sm tracking-tight">The Card</span>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed max-w-sm">
            Sports prediction markets for fans. Real markets, live odds, no house edge.
            Powered by Kalshi&apos;s regulated exchange.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
          <span className="text-[10px] text-[var(--color-text-muted)] opacity-40 mt-1 font-mono">v{VERSION}</span>
        </div>
      </footer>

    </div>
  );
}
