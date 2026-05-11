"use client";

import { forwardRef, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { useI18n } from "@/contexts/i18n-context";
import { type TranslationKey } from "@/lib/i18n";

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

interface CalendarEvent extends KeyDate {
  sport: SportSeason;
  parsedDate: Date;
  daysAway: number;
  mood: TranslationKey;
  marketCount: number;
}

const SPORTS: SportSeason[] = [
  {
    sport: "FIFA World Cup",
    icon: "WC",
    season: "2026",
    start: "June 11, 2026",
    end: "July 19, 2026",
    note: "USA, Canada, and Mexico. 48 teams, 104 matches.",
    keyDates: [
      { label: "Group Stage opens", date: "June 11, 2026" },
      { label: "Group Stage ends", date: "July 2, 2026" },
      { label: "Round of 16", date: "July 4-7, 2026" },
      { label: "Quarterfinals", date: "July 10-11, 2026" },
      { label: "Semifinals", date: "July 14-15, 2026" },
      { label: "Final", date: "July 19, 2026" },
    ],
  },
  {
    sport: "MLB",
    icon: "MLB",
    season: "2026",
    start: "March 26, 2026",
    end: "November 1, 2026",
    keyDates: [
      { label: "All-Star Game", date: "July 14, 2026" },
      { label: "Trade Deadline", date: "July 31, 2026" },
      { label: "Wild Card Games", date: "September 29-30, 2026" },
      { label: "Division Series", date: "October 5-13, 2026" },
      { label: "Championship Series", date: "October 14-22, 2026" },
      { label: "World Series", date: "October 23 - November 1, 2026" },
    ],
  },
  {
    sport: "US Open Tennis",
    icon: "USO",
    season: "2026",
    start: "August 24, 2026",
    end: "September 6, 2026",
    note: "USTA Billie Jean King National Tennis Center, New York.",
    keyDates: [
      { label: "Qualifying", date: "August 18-23, 2026" },
      { label: "Main Draw begins", date: "August 24, 2026" },
      { label: "Quarterfinals", date: "September 1-2, 2026" },
      { label: "Semifinals", date: "September 4-5, 2026" },
      { label: "Finals", date: "September 6-7, 2026" },
    ],
  },
  {
    sport: "NFL",
    icon: "NFL",
    season: "2026",
    start: "August 6, 2026",
    end: "February 1, 2027",
    note: "Super Bowl LXI at Levi's Stadium, Santa Clara.",
    keyDates: [
      { label: "Hall of Fame Game", date: "August 6, 2026" },
      { label: "Preseason Week 1", date: "August 13-17, 2026" },
      { label: "Preseason Week 2", date: "August 21-24, 2026" },
      { label: "Preseason Week 3 roster cutdown", date: "August 27-28, 2026" },
      { label: "Regular Season opens", date: "September 3, 2026" },
      { label: "Week 1 Sunday games", date: "September 6, 2026" },
      { label: "Thanksgiving", date: "November 26, 2026" },
      { label: "Week 18 regular season ends", date: "January 3, 2027" },
      { label: "Wild Card Weekend", date: "January 10-11, 2027" },
      { label: "Divisional Round", date: "January 17-18, 2027" },
      { label: "Conference Championships", date: "January 24-25, 2027" },
      { label: "Super Bowl LXI", date: "February 1, 2027" },
    ],
  },
  {
    sport: "College Football",
    icon: "CFB",
    season: "2026",
    start: "August 22, 2026",
    end: "January 19, 2027",
    note: "12-team College Football Playoff.",
    keyDates: [
      { label: "Week 0 early kickoffs", date: "August 22, 2026" },
      { label: "Week 1 season opener", date: "August 29, 2026" },
      { label: "Labor Day weekend", date: "September 5-7, 2026" },
      { label: "Conference Championship Games", date: "December 6, 2026" },
      { label: "CFP First Round", date: "December 19-20, 2026" },
      { label: "CFP Quarterfinals", date: "January 1-2, 2027" },
      { label: "CFP Semifinals", date: "January 8-9, 2027" },
      { label: "CFP National Championship", date: "January 19, 2027" },
    ],
  },
  {
    sport: "Premier League",
    icon: "EPL",
    season: "2026-27",
    start: "August 15, 2026",
    end: "May 23, 2027",
    keyDates: [
      { label: "Season opens", date: "August 15, 2026" },
      { label: "International Break", date: "September 6-14, 2026" },
      { label: "Boxing Day fixtures", date: "December 26, 2026" },
      { label: "New Year's Day fixtures", date: "January 1, 2027" },
      { label: "Final day all games simultaneous", date: "May 23, 2027" },
    ],
  },
  {
    sport: "UEFA Champions League",
    icon: "UCL",
    season: "2026-27",
    start: "September 16, 2026",
    end: "May 29, 2027",
    keyDates: [
      { label: "League Phase begins", date: "September 16, 2026" },
      { label: "League Phase ends", date: "January 27, 2027" },
      { label: "Knockout Play-offs", date: "February 11-19, 2027" },
      { label: "Round of 16", date: "March 4-12, 2027" },
      { label: "Quarterfinals", date: "April 7-15, 2027" },
      { label: "Semifinals", date: "April 28 - May 6, 2027" },
      { label: "Final", date: "May 29, 2027" },
    ],
  },
  {
    sport: "NBA",
    icon: "NBA",
    season: "2026-27",
    start: "October 22, 2026",
    end: "June 2027",
    keyDates: [
      { label: "Regular Season opens", date: "October 22, 2026" },
      { label: "Christmas Day games", date: "December 25, 2026" },
      { label: "Trade Deadline", date: "February 5, 2027" },
      { label: "All-Star Weekend", date: "February 13-15, 2027" },
      { label: "Regular Season ends", date: "April 12, 2027" },
      { label: "Play-In Tournament", date: "April 15-18, 2027" },
      { label: "First Round begins", date: "April 19, 2027" },
      { label: "NBA Finals", date: "June 2027" },
    ],
  },
  {
    sport: "NHL",
    icon: "NHL",
    season: "2026-27",
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
    icon: "CBB",
    season: "2026-27",
    start: "November 10, 2026",
    end: "April 6, 2027",
    keyDates: [
      { label: "Season Tipoff", date: "November 10, 2026" },
      { label: "Conference Tournaments", date: "March 9-14, 2027" },
      { label: "Selection Sunday", date: "March 14, 2027" },
      { label: "First Four", date: "March 16-17, 2027" },
      { label: "First and Second Rounds", date: "March 18-21, 2027" },
      { label: "Sweet 16", date: "March 26-27, 2027" },
      { label: "Elite Eight", date: "March 28-29, 2027" },
      { label: "Final Four", date: "April 3-4, 2027" },
      { label: "National Championship", date: "April 6, 2027" },
    ],
  },
  {
    sport: "Australian Open",
    icon: "AUS",
    season: "2027",
    start: "January 18, 2027",
    end: "February 1, 2027",
    note: "Melbourne Park, Australia.",
    keyDates: [
      { label: "Main Draw begins", date: "January 18, 2027" },
      { label: "Quarterfinals", date: "January 27-28, 2027" },
      { label: "Semifinals", date: "January 29-30, 2027" },
      { label: "Finals", date: "January 31 - February 1, 2027" },
    ],
  },
  {
    sport: "Golf - Masters",
    icon: "MST",
    season: "2027",
    start: "April 8, 2027",
    end: "April 11, 2027",
    note: "Augusta National Golf Club.",
    keyDates: [
      { label: "Practice Rounds", date: "April 5-7, 2027" },
      { label: "Round 1", date: "April 8, 2027" },
      { label: "Round 2 cut", date: "April 9, 2027" },
      { label: "Round 3 Moving Day", date: "April 10, 2027" },
      { label: "Round 4 Final", date: "April 11, 2027" },
    ],
  },
  {
    sport: "Golf - PGA Championship",
    icon: "PGA",
    season: "2027",
    start: "May 20, 2027",
    end: "May 23, 2027",
    keyDates: [
      { label: "Round 1", date: "May 20, 2027" },
      { label: "Round 2 cut", date: "May 21, 2027" },
      { label: "Round 4 Final", date: "May 23, 2027" },
    ],
  },
  {
    sport: "French Open",
    icon: "RG",
    season: "2027",
    start: "May 25, 2027",
    end: "June 8, 2027",
    note: "Roland Garros, Paris.",
    keyDates: [
      { label: "Main Draw begins", date: "May 25, 2027" },
      { label: "Quarterfinals", date: "June 3-4, 2027" },
      { label: "Semifinals", date: "June 5-6, 2027" },
      { label: "Finals", date: "June 7-8, 2027" },
    ],
  },
  {
    sport: "Golf - US Open",
    icon: "USG",
    season: "2027",
    start: "June 17, 2027",
    end: "June 20, 2027",
    keyDates: [
      { label: "Round 1", date: "June 17, 2027" },
      { label: "Round 2 cut", date: "June 18, 2027" },
      { label: "Round 4 Final", date: "June 20, 2027" },
    ],
  },
  {
    sport: "Wimbledon",
    icon: "WIM",
    season: "2027",
    start: "June 28, 2027",
    end: "July 13, 2027",
    note: "All England Club, London.",
    keyDates: [
      { label: "Main Draw begins", date: "June 28, 2027" },
      { label: "Middle Sunday rest day", date: "July 6, 2027" },
      { label: "Quarterfinals", date: "July 8-9, 2027" },
      { label: "Semifinals", date: "July 10-11, 2027" },
      { label: "Finals", date: "July 12-13, 2027" },
    ],
  },
  {
    sport: "Golf - The Open Championship",
    icon: "OPEN",
    season: "2027",
    start: "July 15, 2027",
    end: "July 18, 2027",
    keyDates: [
      { label: "Round 1", date: "July 15, 2027" },
      { label: "Round 2 cut", date: "July 16, 2027" },
      { label: "Round 4 Final", date: "July 18, 2027" },
    ],
  },
];

const CATEGORIES = [
  {
    label: "calendar.categoryNow",
    sports: ["FIFA World Cup", "MLB", "US Open Tennis"],
  },
  {
    label: "calendar.categoryFall",
    sports: ["NFL", "College Football", "Premier League", "UEFA Champions League", "NBA", "NHL"],
  },
  {
    label: "calendar.categoryWinter",
    sports: ["College Basketball", "Australian Open"],
  },
  {
    label: "calendar.categorySpring",
    sports: [
      "Golf - Masters",
      "Golf - PGA Championship",
      "French Open",
      "Golf - US Open",
      "Wimbledon",
      "Golf - The Open Championship",
    ],
  },
];

const ONE_DAY = 1000 * 60 * 60 * 24;

function parseEventDate(date: string) {
  const normalized = date.replace(/\s+/g, " ").trim();
  const year = normalized.match(/(\d{4})/)?.[1];
  const monthDay = normalized.match(/^([A-Za-z]+)\s+(\d{1,2})/);
  const firstDate = monthDay && year ? `${monthDay[1]} ${monthDay[2]}, ${year}` : normalized;
  const parsed = new Date(firstDate);
  return Number.isNaN(parsed.getTime()) ? new Date("2026-05-11T12:00:00") : parsed;
}

function daysBetween(from: Date, to: Date) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.max(0, Math.ceil((end - start) / ONE_DAY));
}

function eventMood(event: KeyDate, sport: SportSeason): TranslationKey {
  const text = `${sport.sport} ${event.label}`.toLowerCase();
  if (text.includes("final") || text.includes("championship") || text.includes("super bowl") || text.includes("world series")) {
    return "calendar.moodMarquee";
  }
  if (text.includes("trade") || text.includes("deadline") || text.includes("selection")) {
    return "calendar.moodMarketShift";
  }
  if (text.includes("opens") || text.includes("begins") || text.includes("week 1")) {
    return "calendar.moodOpeningBell";
  }
  if (text.includes("playoff") || text.includes("knockout") || text.includes("round")) {
    return "calendar.moodPressureSlate";
  }
  return "calendar.moodWatchlist";
}

function marketCountFor(event: KeyDate, sport: SportSeason) {
  const base = Math.max(4, Math.min(14, sport.keyDates.length + 2));
  const label = `${sport.sport} ${event.label}`.toLowerCase();
  if (label.includes("final") || label.includes("super bowl")) return base + 8;
  if (label.includes("playoff") || label.includes("world cup") || label.includes("week 1")) return base + 5;
  if (label.includes("trade") || label.includes("deadline")) return base + 3;
  return base;
}

function intensityFor(sport: SportSeason) {
  const count = sport.keyDates.length;
  if (count >= 9) return { label: "calendar.intensityLoaded" as const, bar: "w-full", tone: "from-red-500 to-amber-400" };
  if (count >= 6) return { label: "calendar.intensityActive" as const, bar: "w-3/4", tone: "from-sky-400 to-red-400" };
  if (count >= 4) return { label: "calendar.intensityPlayable" as const, bar: "w-1/2", tone: "from-emerald-400 to-sky-400" };
  return { label: "calendar.intensityLight" as const, bar: "w-1/3", tone: "from-zinc-500 to-zinc-300" };
}

function buildEvents(today: Date): CalendarEvent[] {
  return SPORTS.flatMap((sport) =>
    sport.keyDates.map((keyDate) => {
      const parsedDate = parseEventDate(keyDate.date);
      return {
        ...keyDate,
        sport,
        parsedDate,
        daysAway: daysBetween(today, parsedDate),
        mood: eventMood(keyDate, sport),
        marketCount: marketCountFor(keyDate, sport),
      };
    }),
  ).sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
}

function isWorldCupEvent(event: CalendarEvent) {
  return event.sport.sport === "FIFA World Cup";
}

function slateLinksFor(event: CalendarEvent) {
  if (isWorldCupEvent(event)) {
    return {
      card: "/world-cup#free-card",
      forecast: "/world-cup#leaderboards",
      live: "/world-cup#live-bets",
    };
  }

  return {
    card: "/card",
    forecast: "/forecast",
    live: "/live",
  };
}

export default function SportsCalendarPage() {
  const { t } = useI18n();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const today = useMemo(() => new Date(), []);
  const sportMap = useMemo(() => Object.fromEntries(SPORTS.map((s) => [s.sport, s])), []);
  const events = useMemo(() => buildEvents(today), [today]);
  const upcoming = events.filter((event) => event.parsedDate >= today).slice(0, 6);
  const featured = upcoming[0] ?? events[0] ?? null;
  if (!featured) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] p-8 text-[var(--color-text-primary)]">
        <Link href="/card" className="text-sm font-bold text-[var(--color-brand-primary)] hover:underline">
          {t("calendar.back")}
        </Link>
        <p className="mt-6 text-sm text-[var(--color-text-muted)]">{t("calendar.empty")}</p>
      </div>
    );
  }
  const drawerEvent = selectedEvent ?? featured;
  const featuredLinks = slateLinksFor(featured);

  function openSlateDetails(event: CalendarEvent) {
    setSelectedEvent(event);
    window.requestAnimationFrame(() => {
      drawerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] pt-8 pb-32">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link href="/card" className="text-sm font-bold text-[var(--color-brand-primary)] hover:underline">
            {t("calendar.back")}
          </Link>
          <div className="hidden items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] sm:flex">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            {t("calendar.livePlanner")}
          </div>
        </div>

        <section className="mb-6 overflow-hidden rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)]">
          <div
            className="relative min-h-[300px] bg-cover bg-center"
            style={{ backgroundImage: "url('/card/og.png')" }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/78 to-black/20" />
            <div className="relative grid min-h-[300px] gap-6 p-5 sm:p-7 lg:grid-cols-[1.4fr_0.9fr]">
              <div className="flex max-w-2xl flex-col justify-end">
                <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">
                  {t("calendar.featuredSlate")}
                </p>
                <h1 className="mt-2 text-3xl font-display font-black text-white sm:text-5xl">
                  {featured.sport.sport}: {featured.label}
                </h1>
                <p className="mt-3 max-w-xl text-sm text-white/72">
                  {t("calendar.featuredBody", { date: featured.date, count: String(featured.marketCount) })}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <SlateLink href={featuredLinks.card} label={t("calendar.openCard")} />
                  <SlateLink href={featuredLinks.forecast} label={t("calendar.forecastBoard")} />
                  <SlateLink href={featuredLinks.live} label={t("calendar.liveMarkets")} />
                </div>
              </div>
              <div className="self-end rounded-lg border border-white/15 bg-black/45 p-4 backdrop-blur">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/45">{t("calendar.nextLock")}</p>
                <p className="mt-2 text-2xl font-display font-black text-white">{featured.daysAway} {t("calendar.days")}</p>
                <p className="mt-1 text-xs text-white/60">{t(featured.mood)} / {featured.sport.season}</p>
                <button
                  type="button"
                  onClick={() => openSlateDetails(featured)}
                  className="mt-4 w-full rounded-lg bg-[var(--color-brand-primary)] px-4 py-3 text-sm font-black text-white transition hover:brightness-110"
                >
                  {t("calendar.viewDetails")}
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <main>
            <section className="mb-6 grid gap-3 sm:grid-cols-3">
              <PulseMetric label={t("calendar.nextMarkets")} value={String(upcoming.length)} detail={t("calendar.inLockRail")} />
              <PulseMetric label={t("calendar.featuredCount")} value={String(featured.marketCount)} detail={t("calendar.expectedMarkets")} />
              <PulseMetric label={t("calendar.calendarMood")} value={t(featured.mood)} detail={t("calendar.currentSlateTag")} />
            </section>

            {CATEGORIES.map((cat) => (
              <section key={cat.label} className="mb-10">
                <h2 className="mb-4 text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">
                  {t(cat.label as TranslationKey)}
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {cat.sports.map((name) => {
                    const sport = sportMap[name];
                    if (!sport) return null;
                    return (
                      <SportCard
                        key={name}
                        sport={sport}
                        today={today}
                        onSelectEvent={setSelectedEvent}
                        t={t}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </main>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <UpcomingLocks events={upcoming} onSelectEvent={setSelectedEvent} t={t} />
            <TodayDrawer ref={drawerRef} event={drawerEvent} t={t} />
          </aside>
        </div>
      </div>
    </div>
  );
}

function SlateLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition hover:border-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]"
    >
      {label}
    </Link>
  );
}

function PulseMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-display font-black text-[var(--color-card-text)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{detail}</p>
    </div>
  );
}

function UpcomingLocks({
  events,
  onSelectEvent,
  t,
}: {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  t: ReturnType<typeof useI18n>["t"];
}) {
  return (
    <section className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-black text-[var(--color-card-text)]">{t("calendar.upcomingLocks")}</h2>
        <span className="rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-red-300">
          {t("calendar.liveRail")}
        </span>
      </div>
      <div className="space-y-2">
        {events.map((event) => (
          <button
            key={`${event.sport.sport}-${event.label}`}
            type="button"
            onClick={() => onSelectEvent(event)}
            className="w-full rounded-lg border border-[var(--color-card-border)] bg-black/10 p-3 text-left transition hover:border-[var(--color-brand-primary)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black text-[var(--color-card-text)]">{event.sport.sport}</p>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{event.label}</p>
              </div>
              <span className="shrink-0 text-xs font-black text-[var(--color-brand-primary)]">{event.daysAway}d</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

const TodayDrawer = forwardRef<HTMLElement, { event: CalendarEvent; t: ReturnType<typeof useI18n>["t"] }>(
function TodayDrawer({ event, t }, ref) {
  const eventLinks = slateLinksFor(event);

  return (
    <section
      ref={ref}
      id="slate-details"
      className="scroll-mt-6 rounded-xl border border-[var(--color-brand-primary)]/40 bg-[var(--color-card-surface)] p-4 shadow-[0_0_35px_rgba(239,68,68,0.08)]"
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{t("calendar.dateDrawer")}</p>
      <h2 className="mt-2 text-xl font-display font-black text-[var(--color-card-text)]">{event.sport.sport}</h2>
      <p className="mt-1 text-sm font-bold text-[var(--color-text-secondary)]">{event.label}</p>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{event.date}</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <DrawerStat label={t("calendar.mood")} value={t(event.mood)} />
        <DrawerStat label={t("calendar.markets")} value={String(event.marketCount)} />
        <DrawerStat label={t("calendar.locksIn")} value={`${event.daysAway}d`} />
        <DrawerStat label={t("calendar.season")} value={event.sport.season} />
      </div>

      {event.sport.note && (
        <p className="mt-4 rounded-lg border border-[var(--color-card-border)] bg-black/10 p-3 text-xs text-[var(--color-text-muted)]">
          {event.sport.note}
        </p>
      )}

      <div className="mt-4 grid gap-2">
        <Link href={eventLinks.card} className="rounded-lg bg-[var(--color-brand-primary)] px-4 py-3 text-center text-sm font-black text-white">
          {t("calendar.buildCard")}
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <Link href={eventLinks.forecast} className="rounded-lg border border-[var(--color-card-border)] px-3 py-2 text-center text-xs font-bold text-[var(--color-card-text)]">
            {t("calendar.forecast")}
          </Link>
          <Link href={eventLinks.live} className="rounded-lg border border-[var(--color-card-border)] px-3 py-2 text-center text-xs font-bold text-[var(--color-card-text)]">
            {t("calendar.live")}
          </Link>
        </div>
      </div>
    </section>
  );
});
TodayDrawer.displayName = "TodayDrawer";

function DrawerStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-card-border)] bg-black/10 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-black text-[var(--color-card-text)]">{value}</p>
    </div>
  );
}

function SportCard({
  sport,
  today,
  onSelectEvent,
  t,
}: {
  sport: SportSeason;
  today: Date;
  onSelectEvent: (event: CalendarEvent) => void;
  t: ReturnType<typeof useI18n>["t"];
}) {
  const intensity = intensityFor(sport);
  const nextDate = parseEventDate(sport.keyDates[0]?.date ?? sport.start);
  const daysAway = daysBetween(today, nextDate);

  return (
    <article className="overflow-hidden rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)]">
      <div className={`h-1 bg-gradient-to-r ${intensity.tone}`}>
        <div className={`h-full ${intensity.bar} bg-white/40`} />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-[var(--color-card-border)] bg-black/15 px-2 py-1 text-[10px] font-black text-[var(--color-card-text)]">
                {sport.icon}
              </span>
              <p className="text-sm font-black text-[var(--color-card-text)]">{sport.sport}</p>
            </div>
            {sport.note && <p className="mt-2 text-xs text-[var(--color-text-muted)]">{sport.note}</p>}
          </div>
          <span className="shrink-0 rounded-full bg-black/15 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
            {t(intensity.label)}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <MiniStat label={t("calendar.start")} value={sport.start.split(",")[0] ?? sport.start} />
          <MiniStat label={t("calendar.next")} value={`${daysAway}d`} />
          <MiniStat label={t("calendar.dates")} value={String(sport.keyDates.length)} />
        </div>

        {sport.sport === "FIFA World Cup" && (
          <Link
            href="/world-cup"
            className="mt-3 block rounded-lg bg-[var(--color-brand-primary)] px-4 py-3 text-center text-xs font-black text-white transition hover:brightness-110"
          >
            {t("calendar.worldCupCampaign")}
          </Link>
        )}
      </div>

      <div className="divide-y divide-[var(--color-card-border)]">
        {sport.keyDates.slice(0, 5).map((keyDate) => {
          const parsedDate = parseEventDate(keyDate.date);
          const event: CalendarEvent = {
            ...keyDate,
            sport,
            parsedDate,
            daysAway: daysBetween(today, parsedDate),
            mood: eventMood(keyDate, sport),
            marketCount: marketCountFor(keyDate, sport),
          };

          return (
            <button
              key={keyDate.label}
              type="button"
              onClick={() => onSelectEvent(event)}
              className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-white/[0.03]"
            >
              <span className="min-w-0 text-xs text-[var(--color-text-secondary)]">{keyDate.label}</span>
              <span className="shrink-0 text-right text-xs font-semibold text-[var(--color-card-text)]">
                {keyDate.date}
              </span>
            </button>
          );
        })}
      </div>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-card-border)] bg-black/10 px-2 py-2">
      <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 truncate text-xs font-black text-[var(--color-card-text)]">{value}</p>
    </div>
  );
}
