"use client";

import Link from "next/link";

interface KeyDate {
  label: string;
  date: string;
}

interface SportSeason {
  sport: string;
  icon: string;
  season: string;
  start: string;
  end: string;
  keyDates: KeyDate[];
  note?: string;
}

// Ordered by next upcoming event from May 2026
const SPORTS: SportSeason[] = [
  {
    sport: "FIFA World Cup",
    icon: "⚽",
    season: "2026",
    start: "June 11, 2026",
    end: "July 19, 2026",
    note: "USA · Canada · Mexico — 48 teams, 104 matches",
    keyDates: [
      { label: "Group Stage opens", date: "June 11, 2026" },
      { label: "Group Stage ends", date: "July 2, 2026" },
      { label: "Round of 16", date: "July 4–7, 2026" },
      { label: "Quarterfinals", date: "July 10–11, 2026" },
      { label: "Semifinals", date: "July 14–15, 2026" },
      { label: "Final", date: "July 19, 2026" },
    ],
  },
  {
    sport: "MLB",
    icon: "⚾",
    season: "2026",
    start: "March 26, 2026",
    end: "November 1, 2026",
    keyDates: [
      { label: "All-Star Game", date: "July 14, 2026" },
      { label: "Trade Deadline", date: "July 31, 2026" },
      { label: "Wild Card Games", date: "September 29–30, 2026" },
      { label: "Division Series", date: "October 5–13, 2026" },
      { label: "Championship Series", date: "October 14–22, 2026" },
      { label: "World Series", date: "October 23 – November 1, 2026" },
    ],
  },
  {
    sport: "US Open Tennis",
    icon: "🎾",
    season: "2026",
    start: "August 24, 2026",
    end: "September 6, 2026",
    note: "USTA Billie Jean King National Tennis Center, New York",
    keyDates: [
      { label: "Qualifying", date: "August 18–23, 2026" },
      { label: "Main Draw begins", date: "August 24, 2026" },
      { label: "Quarterfinals", date: "September 1–2, 2026" },
      { label: "Semifinals", date: "September 4–5, 2026" },
      { label: "Finals", date: "September 6–7, 2026" },
    ],
  },
  {
    sport: "NFL",
    icon: "🏈",
    season: "2026",
    start: "August 6, 2026",
    end: "February 1, 2027",
    note: "Super Bowl LXI — Levi's Stadium, Santa Clara",
    keyDates: [
      { label: "Hall of Fame Game", date: "August 6, 2026" },
      { label: "Preseason Week 1", date: "August 13–17, 2026" },
      { label: "Preseason Week 2", date: "August 21–24, 2026" },
      { label: "Preseason Week 3 (roster cutdown)", date: "August 27–28, 2026" },
      { label: "Regular Season opens (Thursday Night)", date: "September 3, 2026" },
      { label: "Week 1 Sunday games", date: "September 6, 2026" },
      { label: "Thanksgiving", date: "November 26, 2026" },
      { label: "Week 18 — Regular Season ends", date: "January 3, 2027" },
      { label: "Wild Card Weekend", date: "January 10–11, 2027" },
      { label: "Divisional Round", date: "January 17–18, 2027" },
      { label: "Conference Championships", date: "January 24–25, 2027" },
      { label: "Super Bowl LXI", date: "February 1, 2027" },
    ],
  },
  {
    sport: "College Football",
    icon: "🏈",
    season: "2026",
    start: "August 22, 2026",
    end: "January 19, 2027",
    note: "12-team College Football Playoff",
    keyDates: [
      { label: "Week 0 — early kickoffs", date: "August 22, 2026" },
      { label: "Week 1 — season opener", date: "August 29, 2026" },
      { label: "Labor Day weekend", date: "September 5–7, 2026" },
      { label: "Conference Championship Games", date: "December 6, 2026" },
      { label: "CFP First Round (campus sites)", date: "December 19–20, 2026" },
      { label: "CFP Quarterfinals (New Year's Six bowls)", date: "January 1–2, 2027" },
      { label: "CFP Semifinals", date: "January 8–9, 2027" },
      { label: "CFP National Championship", date: "January 19, 2027" },
    ],
  },
  {
    sport: "Premier League",
    icon: "⚽",
    season: "2026–27",
    start: "August 15, 2026",
    end: "May 23, 2027",
    keyDates: [
      { label: "Season opens — Matchday 1", date: "August 15, 2026" },
      { label: "International Break", date: "September 6–14, 2026" },
      { label: "Boxing Day fixtures", date: "December 26, 2026" },
      { label: "New Year's Day fixtures", date: "January 1, 2027" },
      { label: "Final day — all games simultaneous", date: "May 23, 2027" },
    ],
  },
  {
    sport: "UEFA Champions League",
    icon: "⚽",
    season: "2026–27",
    start: "September 16, 2026",
    end: "May 29, 2027",
    keyDates: [
      { label: "League Phase begins", date: "September 16, 2026" },
      { label: "League Phase ends", date: "January 27, 2027" },
      { label: "Knockout Play-offs", date: "February 11–19, 2027" },
      { label: "Round of 16", date: "March 4–12, 2027" },
      { label: "Quarterfinals", date: "April 7–15, 2027" },
      { label: "Semifinals", date: "April 28 – May 6, 2027" },
      { label: "Final", date: "May 29, 2027" },
    ],
  },
  {
    sport: "NBA",
    icon: "🏀",
    season: "2026–27",
    start: "October 22, 2026",
    end: "June 2027",
    keyDates: [
      { label: "Regular Season opens", date: "October 22, 2026" },
      { label: "Christmas Day games", date: "December 25, 2026" },
      { label: "Trade Deadline", date: "February 5, 2027" },
      { label: "All-Star Weekend", date: "February 13–15, 2027" },
      { label: "Regular Season ends", date: "April 12, 2027" },
      { label: "Play-In Tournament", date: "April 15–18, 2027" },
      { label: "First Round begins", date: "April 19, 2027" },
      { label: "NBA Finals", date: "June 2027" },
    ],
  },
  {
    sport: "NHL",
    icon: "🏒",
    season: "2026–27",
    start: "October 7, 2026",
    end: "June 2027",
    keyDates: [
      { label: "Regular Season opens", date: "October 7, 2026" },
      { label: "Winter Classic", date: "January 1, 2027" },
      { label: "All-Star Weekend", date: "February 2027" },
      { label: "Trade Deadline", date: "March 2027" },
      { label: "Regular Season ends", date: "April 17, 2027" },
      { label: "Stanley Cup Playoffs begin", date: "April 21, 2027" },
      { label: "Stanley Cup Finals", date: "June 2027" },
    ],
  },
  {
    sport: "College Basketball",
    icon: "🏀",
    season: "2026–27",
    start: "November 10, 2026",
    end: "April 6, 2027",
    keyDates: [
      { label: "Season Tipoff", date: "November 10, 2026" },
      { label: "Conference Tournaments", date: "March 9–14, 2027" },
      { label: "Selection Sunday", date: "March 14, 2027" },
      { label: "First Four", date: "March 16–17, 2027" },
      { label: "First & Second Rounds", date: "March 18–21, 2027" },
      { label: "Sweet 16", date: "March 26–27, 2027" },
      { label: "Elite Eight", date: "March 28–29, 2027" },
      { label: "Final Four", date: "April 3–4, 2027" },
      { label: "National Championship", date: "April 6, 2027" },
    ],
  },
  {
    sport: "Australian Open",
    icon: "🎾",
    season: "2027",
    start: "January 18, 2027",
    end: "February 1, 2027",
    note: "Melbourne Park, Australia",
    keyDates: [
      { label: "Main Draw begins", date: "January 18, 2027" },
      { label: "Quarterfinals", date: "January 27–28, 2027" },
      { label: "Semifinals", date: "January 29–30, 2027" },
      { label: "Finals", date: "January 31 – February 1, 2027" },
    ],
  },
  {
    sport: "Golf — Masters",
    icon: "⛳",
    season: "2027",
    start: "April 8, 2027",
    end: "April 11, 2027",
    note: "Augusta National Golf Club",
    keyDates: [
      { label: "Practice Rounds", date: "April 5–7, 2027" },
      { label: "Round 1", date: "April 8, 2027" },
      { label: "Round 2 (cut)", date: "April 9, 2027" },
      { label: "Round 3 (Moving Day)", date: "April 10, 2027" },
      { label: "Round 4 — Final", date: "April 11, 2027" },
    ],
  },
  {
    sport: "Golf — PGA Championship",
    icon: "⛳",
    season: "2027",
    start: "May 20, 2027",
    end: "May 23, 2027",
    keyDates: [
      { label: "Round 1", date: "May 20, 2027" },
      { label: "Round 2 (cut)", date: "May 21, 2027" },
      { label: "Round 4 — Final", date: "May 23, 2027" },
    ],
  },
  {
    sport: "French Open",
    icon: "🎾",
    season: "2027",
    start: "May 25, 2027",
    end: "June 8, 2027",
    note: "Roland Garros, Paris",
    keyDates: [
      { label: "Main Draw begins", date: "May 25, 2027" },
      { label: "Quarterfinals", date: "June 3–4, 2027" },
      { label: "Semifinals", date: "June 5–6, 2027" },
      { label: "Finals", date: "June 7–8, 2027" },
    ],
  },
  {
    sport: "Golf — US Open",
    icon: "⛳",
    season: "2027",
    start: "June 17, 2027",
    end: "June 20, 2027",
    keyDates: [
      { label: "Round 1", date: "June 17, 2027" },
      { label: "Round 2 (cut)", date: "June 18, 2027" },
      { label: "Round 4 — Final", date: "June 20, 2027" },
    ],
  },
  {
    sport: "Wimbledon",
    icon: "🎾",
    season: "2027",
    start: "June 28, 2027",
    end: "July 13, 2027",
    note: "All England Club, London",
    keyDates: [
      { label: "Main Draw begins", date: "June 28, 2027" },
      { label: "Middle Sunday (rest day)", date: "July 6, 2027" },
      { label: "Quarterfinals", date: "July 8–9, 2027" },
      { label: "Semifinals", date: "July 10–11, 2027" },
      { label: "Finals", date: "July 12–13, 2027" },
    ],
  },
  {
    sport: "Golf — The Open Championship",
    icon: "⛳",
    season: "2027",
    start: "July 15, 2027",
    end: "July 18, 2027",
    keyDates: [
      { label: "Round 1", date: "July 15, 2027" },
      { label: "Round 2 (cut)", date: "July 16, 2027" },
      { label: "Round 4 — Final", date: "July 18, 2027" },
    ],
  },
];

const CATEGORIES = [
  {
    label: "Happening Now / Next Up",
    sports: ["FIFA World Cup", "MLB", "US Open Tennis"],
  },
  {
    label: "Fall 2026",
    sports: ["NFL", "College Football", "Premier League", "UEFA Champions League", "NBA", "NHL"],
  },
  {
    label: "Winter / Spring 2027",
    sports: ["College Basketball", "Australian Open"],
  },
  {
    label: "Spring / Summer 2027",
    sports: [
      "Golf — Masters",
      "Golf — PGA Championship",
      "French Open",
      "Golf — US Open",
      "Wimbledon",
      "Golf — The Open Championship",
    ],
  },
];

export default function SportsCalendarPage() {
  const sportMap = Object.fromEntries(SPORTS.map((s) => [s.sport, s]));

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] pt-8 pb-32">
      <div className="max-w-2xl mx-auto px-4">

        <div className="mb-10">
          <Link href="/card" className="text-sm text-[var(--color-brand-primary)] hover:underline mb-4 inline-block">
            ← Back
          </Link>
          <h1 className="text-4xl font-display font-black mb-2">Sports Calendar</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Season dates and key events for every sport on The Card. Individual game matchups added as each season approaches.
          </p>
        </div>

        <Link
          href="/card"
          className="group mb-10 block overflow-hidden rounded-xl border border-[var(--color-brand-primary)]/35 bg-[var(--color-card-surface)] transition-all hover:border-[var(--color-brand-primary)]/70"
        >
          <div
            className="relative min-h-[190px] bg-cover bg-center"
            style={{ backgroundImage: "url('/card/og.png')" }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">
                  Ready to play
                </p>
                <p className="mt-1 text-2xl font-display font-black text-white">
                  Tonight&apos;s Card
                </p>
                <p className="mt-1 max-w-sm text-xs text-white/70">
                  Jump from the season calendar into live markets, odds, and open positions.
                </p>
              </div>
              <span className="shrink-0 rounded-lg bg-[var(--color-brand-primary)] px-3 py-2 text-xs font-black text-white transition-transform group-hover:translate-x-0.5">
                Open Card →
              </span>
            </div>
          </div>
        </Link>

        {CATEGORIES.map((cat) => (
          <div key={cat.label} className="mb-12">
            <h2 className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest mb-5">
              {cat.label}
            </h2>
            <div className="flex flex-col gap-4">
              {cat.sports.map((name) => {
                const s = sportMap[name];
                if (!s) return null;
                return <SportCard key={name} sport={s} />;
              })}
            </div>
          </div>
        ))}

        <div className="border-t border-[var(--color-card-border)] pt-8 pb-4 text-center">
          <p className="text-xs text-[var(--color-text-muted)]">
            Head-to-head matchups for NFL, college football, NBA, NHL, Premier League, and more will be added as each season approaches.
          </p>
        </div>

      </div>
    </div>
  );
}

function SportCard({ sport }: { sport: SportSeason }) {
  return (
    <div className="border border-[var(--color-card-border)] rounded-xl bg-[var(--color-card-surface)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-card-border)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl shrink-0">{sport.icon}</span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[var(--color-card-text)]">{sport.sport}</p>
            {sport.note && (
              <p className="text-[10px] text-[var(--color-text-muted)] truncate">{sport.note}</p>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-medium text-[var(--color-text-muted)]">{sport.start}</p>
          <p className="text-[10px] text-[var(--color-text-muted)]">→ {sport.end}</p>
        </div>
      </div>

      <div className="divide-y divide-[var(--color-card-border)]">
        {sport.keyDates.map((kd) => (
          <div key={kd.label} className="px-4 py-2.5 flex items-center justify-between gap-4">
            <span className="text-xs text-[var(--color-text-secondary)]">{kd.label}</span>
            <span className="text-xs font-semibold text-[var(--color-card-text)] shrink-0 text-right">
              {kd.date}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
