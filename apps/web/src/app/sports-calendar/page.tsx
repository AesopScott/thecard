"use client";

import Link from "next/link";

interface KeyDate {
  label: string;
  date: string;
}

interface Sport {
  icon: string;
  name: string;
  season: string;
  keyDates: KeyDate[];
}

const SPORTS: Sport[] = [
  {
    icon: "🏈",
    name: "NFL",
    season: "Aug 6 – Feb 1, 2027",
    keyDates: [
      { label: "Hall of Fame Game", date: "Aug 6, 2026" },
      { label: "Preseason kickoff", date: "Aug 13, 2026" },
      { label: "Regular Season begins", date: "Sep 3, 2026" },
      { label: "Wild Card Weekend", date: "Jan 9–11, 2027" },
      { label: "Super Bowl LXI", date: "Feb 1, 2027" },
    ],
  },
  {
    icon: "🏈",
    name: "College Football",
    season: "Aug 29 – Jan 19, 2027",
    keyDates: [
      { label: "Season opener", date: "Aug 29, 2026" },
      { label: "Conference Championship Games", date: "Dec 5–6, 2026" },
      { label: "CFP First Round", date: "Dec 20, 2026" },
      { label: "CFP Semifinals", date: "Jan 1, 2027" },
      { label: "CFP National Championship", date: "Jan 19, 2027" },
    ],
  },
  {
    icon: "⚽",
    name: "FIFA World Cup 2026",
    season: "Jun 11 – Jul 19, 2026",
    keyDates: [
      { label: "Opening Match", date: "Jun 11, 2026" },
      { label: "Group Stage ends", date: "Jun 28, 2026" },
      { label: "Round of 32 begins", date: "Jul 1, 2026" },
      { label: "Quarterfinals", date: "Jul 9–10, 2026" },
      { label: "Final (MetLife Stadium)", date: "Jul 19, 2026" },
    ],
  },
  {
    icon: "⚾",
    name: "MLB",
    season: "Apr 2 – Nov 1, 2026",
    keyDates: [
      { label: "Opening Day", date: "Apr 2, 2026" },
      { label: "All-Star Game", date: "Jul 14, 2026" },
      { label: "Wild Card Games", date: "Sep 29, 2026" },
      { label: "ALCS & NLCS", date: "Oct 8–19, 2026" },
      { label: "World Series", date: "Oct 20 – Nov 1, 2026" },
    ],
  },
  {
    icon: "🏀",
    name: "NBA",
    season: "Oct 21, 2026 – Jun 22, 2027",
    keyDates: [
      { label: "Opening Night", date: "Oct 21, 2026" },
      { label: "All-Star Weekend", date: "Feb 13–15, 2027" },
      { label: "Regular Season ends", date: "Apr 12, 2027" },
      { label: "Playoffs begin", date: "Apr 18, 2027" },
      { label: "NBA Finals", date: "Jun 2–22, 2027" },
    ],
  },
  {
    icon: "🏒",
    name: "NHL",
    season: "Oct 7, 2026 – Jun 28, 2027",
    keyDates: [
      { label: "Opening Night", date: "Oct 7, 2026" },
      { label: "All-Star Weekend", date: "Feb 6–8, 2027" },
      { label: "Regular Season ends", date: "Apr 17, 2027" },
      { label: "Playoffs begin", date: "Apr 21, 2027" },
      { label: "Stanley Cup Finals", date: "Jun 7–28, 2027" },
    ],
  },
  {
    icon: "🏀",
    name: "College Basketball",
    season: "Nov 10, 2026 – Apr 5, 2027",
    keyDates: [
      { label: "Tip-Off", date: "Nov 10, 2026" },
      { label: "Conference Tournaments", date: "Mar 2–14, 2027" },
      { label: "NCAA Selection Sunday", date: "Mar 14, 2027" },
      { label: "First & Second Rounds", date: "Mar 19–22, 2027" },
      { label: "Final Four & Championship", date: "Apr 3–5, 2027" },
    ],
  },
  {
    icon: "⚽",
    name: "Premier League",
    season: "Aug 15, 2026 – May 23, 2027",
    keyDates: [
      { label: "Season opener", date: "Aug 15, 2026" },
      { label: "Boxing Day fixtures", date: "Dec 26, 2026" },
      { label: "FA Cup Final", date: "May 15, 2027" },
      { label: "Final Matchday", date: "May 23, 2027" },
    ],
  },
  {
    icon: "⚽",
    name: "UEFA Champions League",
    season: "Sep 2026 – May 29, 2027",
    keyDates: [
      { label: "League Phase begins", date: "Sep 16, 2026" },
      { label: "League Phase ends", date: "Jan 29, 2027" },
      { label: "Round of 16", date: "Feb 17 – Mar 18, 2027" },
      { label: "Quarterfinals", date: "Apr 1–16, 2027" },
      { label: "Final (Munich)", date: "May 29, 2027" },
    ],
  },
  {
    icon: "⛳",
    name: "Golf — 2027 Majors",
    season: "Apr – Jul 2027",
    keyDates: [
      { label: "Masters (Augusta)", date: "Apr 8–11, 2027" },
      { label: "PGA Championship", date: "May 20–23, 2027" },
      { label: "U.S. Open", date: "Jun 17–20, 2027" },
      { label: "The Open Championship", date: "Jul 15–18, 2027" },
    ],
  },
  {
    icon: "🎾",
    name: "Tennis — Grand Slams",
    season: "Jan – Sep 2027",
    keyDates: [
      { label: "U.S. Open 2026", date: "Aug 24 – Sep 6, 2026" },
      { label: "Australian Open", date: "Jan 18 – Feb 1, 2027" },
      { label: "French Open (Roland Garros)", date: "May 24 – Jun 8, 2027" },
      { label: "Wimbledon", date: "Jun 28 – Jul 11, 2027" },
      { label: "U.S. Open 2027", date: "Aug 23 – Sep 5, 2027" },
    ],
  },
  {
    icon: "🥊",
    name: "UFC / MMA",
    season: "Year-round",
    keyDates: [
      { label: "UFC events", date: "Every 2–3 weeks" },
      { label: "UFC 300-series Pay-Per-Views", date: "Quarterly" },
      { label: "International Fight Weeks", date: "Jul & Dec" },
    ],
  },
  {
    icon: "🏎️",
    name: "Formula 1",
    season: "Mar – Nov 2026",
    keyDates: [
      { label: "Season opener (Australia)", date: "Mar 15, 2026" },
      { label: "Monaco Grand Prix", date: "May 24, 2026" },
      { label: "British Grand Prix (Silverstone)", date: "Jul 5, 2026" },
      { label: "U.S. Grand Prix (Austin)", date: "Oct 18, 2026" },
      { label: "Season finale (Abu Dhabi)", date: "Nov 22, 2026" },
    ],
  },
  {
    icon: "🏇",
    name: "Horse Racing — Triple Crown",
    season: "May – Jun 2027",
    keyDates: [
      { label: "Kentucky Derby", date: "May 1, 2027" },
      { label: "Preakness Stakes", date: "May 15, 2027" },
      { label: "Belmont Stakes", date: "Jun 5, 2027" },
      { label: "Breeders' Cup", date: "Nov 6–7, 2026" },
    ],
  },
];

export default function SportsCalendarPage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] pt-8 pb-32">
      <div className="max-w-2xl mx-auto px-4">

        <div className="mb-10">
          <Link href="/card" className="text-sm text-[var(--color-brand-primary)] hover:underline mb-4 inline-block">
            ← Back
          </Link>
          <h1 className="text-4xl font-display font-black tracking-tight mb-2">Sports Calendar</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Key dates for every major sport — plan your forecasts around what&apos;s live.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {SPORTS.map((sport) => (
            <div
              key={sport.name}
              className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{sport.icon}</span>
                  <div>
                    <h2 className="font-bold text-base text-[var(--color-card-text)]">{sport.name}</h2>
                    <p className="text-xs text-[var(--color-text-muted)]">{sport.season}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {sport.keyDates.map((kd) => (
                  <div key={kd.label} className="flex items-baseline justify-between gap-4">
                    <span className="text-xs text-[var(--color-text-secondary)] min-w-0">{kd.label}</span>
                    <span className="text-xs font-semibold text-[var(--color-brand-primary)] shrink-0 tabular-nums">{kd.date}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
