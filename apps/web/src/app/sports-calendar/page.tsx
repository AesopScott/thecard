"use client";

import Link from "next/link";

interface SportEvent {
  name: string;
  startMonth: number; // 1-12
  endMonth: number;
  year: number;
  priority: "v1" | "phase2" | "future";
  region?: string;
}

const SPORTS_CALENDAR: SportEvent[] = [
  // 2026
  { name: "NFL Preseason", startMonth: 8, endMonth: 8, year: 2026, priority: "v1" },
  { name: "NFL Regular Season", startMonth: 9, endMonth: 1, year: 2026, priority: "v1" },
  { name: "College Football", startMonth: 9, endMonth: 1, year: 2026, priority: "v1" },
  { name: "MLB (Playoffs/World Series)", startMonth: 10, endMonth: 11, year: 2026, priority: "v1" },
  { name: "NBA Season", startMonth: 10, endMonth: 6, year: 2026, priority: "phase2" },
  { name: "NHL Season", startMonth: 10, endMonth: 6, year: 2026, priority: "phase2" },
  { name: "MLS Cup Playoffs", startMonth: 10, endMonth: 12, year: 2026, priority: "phase2" },
  { name: "Premier League", startMonth: 8, endMonth: 5, year: 2026, priority: "phase2" },
  { name: "La Liga (Spain)", startMonth: 8, endMonth: 5, year: 2026, priority: "phase2" },
  { name: "Serie A (Italy)", startMonth: 8, endMonth: 5, year: 2026, priority: "phase2" },
  { name: "Bundesliga (Germany)", startMonth: 8, endMonth: 5, year: 2026, priority: "phase2" },
  { name: "Ligue 1 (France)", startMonth: 8, endMonth: 5, year: 2026, priority: "phase2" },
  { name: "College Basketball", startMonth: 11, endMonth: 3, year: 2026, priority: "v1" },
  { name: "March Madness (NCAA)", startMonth: 3, endMonth: 4, year: 2027, priority: "v1" },
  { name: "FIFA World Cup 2026", startMonth: 6, endMonth: 7, year: 2026, priority: "future" },
  { name: "PGA Tour (Regular Season)", startMonth: 1, endMonth: 8, year: 2026, priority: "phase2" },
  { name: "PGA Tour (Fall)", startMonth: 8, endMonth: 12, year: 2026, priority: "phase2" },
  { name: "PGA Tour (Spring 2027)", startMonth: 1, endMonth: 8, year: 2027, priority: "phase2" },
  { name: "Golf Majors (Masters)", startMonth: 4, endMonth: 4, year: 2027, priority: "phase2" },
  { name: "Golf Majors (US Open)", startMonth: 6, endMonth: 6, year: 2026, priority: "phase2" },
  { name: "Golf Majors (Open Championship)", startMonth: 7, endMonth: 7, year: 2026, priority: "phase2" },
  { name: "Golf Majors (PGA Championship)", startMonth: 8, endMonth: 8, year: 2026, priority: "phase2" },
  { name: "ATP Tennis (Regular Tour)", startMonth: 1, endMonth: 12, year: 2026, priority: "phase2" },
  { name: "WTA Tennis (Regular Tour)", startMonth: 1, endMonth: 12, year: 2026, priority: "phase2" },
  { name: "Wimbledon", startMonth: 7, endMonth: 7, year: 2026, priority: "phase2" },
  { name: "US Open Tennis", startMonth: 8, endMonth: 9, year: 2026, priority: "phase2" },
  { name: "Australian Open", startMonth: 1, endMonth: 2, year: 2027, priority: "phase2" },
  { name: "French Open", startMonth: 5, endMonth: 6, year: 2027, priority: "phase2" },
  { name: "UFC / MMA (Regular Events)", startMonth: 1, endMonth: 12, year: 2026, priority: "phase2" },
  { name: "Major Boxing Events", startMonth: 1, endMonth: 12, year: 2026, priority: "future" },
  { name: "Rugby Six Nations", startMonth: 2, endMonth: 3, year: 2027, priority: "future" },
  { name: "Rugby Championship", startMonth: 8, endMonth: 10, year: 2026, priority: "future" },
  { name: "Cricket (IPL)", startMonth: 3, endMonth: 5, year: 2027, priority: "future" },
  { name: "Cricket (World Cup)", startMonth: 10, endMonth: 11, year: 2027, priority: "future" },
  { name: "Formula 1 Season", startMonth: 3, endMonth: 11, year: 2026, priority: "future" },
  { name: "Horse Racing (Triple Crown)", startMonth: 5, endMonth: 6, year: 2026, priority: "future" },
  { name: "Horse Racing (Breeders Cup)", startMonth: 11, endMonth: 11, year: 2026, priority: "future" },
  { name: "Tour de France", startMonth: 7, endMonth: 7, year: 2026, priority: "future" },
  { name: "Winter Olympics 2026", startMonth: 2, endMonth: 2, year: 2026, priority: "future" },
  { name: "Summer Olympics 2028", startMonth: 7, endMonth: 8, year: 2028, priority: "future" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const PRIORITY_COLORS = {
  v1: "bg-emerald-900/40 border-emerald-600 text-emerald-100",
  phase2: "bg-blue-900/40 border-blue-600 text-blue-100",
  future: "bg-slate-800/40 border-slate-600 text-slate-300",
};

const PRIORITY_BADGES = {
  v1: "V1 Priority",
  phase2: "Phase 2",
  future: "Future",
};

export default function SportsCalendarPage() {
  const years = [2026, 2027, 2028];

  const getEventsByMonth = (year: number, month: number) => {
    return SPORTS_CALENDAR.filter((event) => {
      if (event.year !== year) return false;
      // Handle events that wrap across years (like NFL season)
      if (event.startMonth <= event.endMonth) {
        return month >= event.startMonth && month <= event.endMonth;
      } else {
        return month >= event.startMonth || month <= event.endMonth;
      }
    });
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] pt-8 pb-32">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <Link href="/learn" className="text-sm text-[var(--color-brand-primary)] hover:underline mb-4 inline-block">
            ← Back
          </Link>
          <h1 className="text-4xl font-bold mb-4">Sports Calendar</h1>
          <p className="text-[var(--color-text-muted)] mb-6">
            Comprehensive sports calendar covering major events across 2026–2028. Reference this to plan seasons and anticipate when you can forecast new sports.
          </p>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-8">
            {Object.entries(PRIORITY_BADGES).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded border ${PRIORITY_COLORS[key as keyof typeof PRIORITY_COLORS]}`}></div>
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar by Year */}
        {years.map((year) => (
          <div key={year} className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-[var(--color-brand-primary)]">{year}</h2>

            {/* Grid of months */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MONTHS.map((month, monthIndex) => {
                const monthNum = monthIndex + 1;
                const events = getEventsByMonth(year, monthNum);

                return (
                  <div
                    key={`${year}-${monthNum}`}
                    className="border border-[var(--color-card-border)] rounded-lg bg-[var(--color-card-surface)] p-4 hover:border-[var(--color-brand-primary)] transition-colors"
                  >
                    <h3 className="font-bold text-lg mb-4 text-[var(--color-brand-primary)]">
                      {month}
                    </h3>

                    {events.length > 0 ? (
                      <div className="space-y-2">
                        {events.map((event, idx) => (
                          <div
                            key={`${event.name}-${idx}`}
                            className={`p-3 rounded border text-sm ${PRIORITY_COLORS[event.priority]}`}
                          >
                            <div className="font-semibold">{event.name}</div>
                            <div className="text-xs opacity-75 mt-1">{PRIORITY_BADGES[event.priority]}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[var(--color-text-muted)] text-sm italic">No major events</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Summary Section */}
        <div className="mt-16 border-t border-[var(--color-card-border)] pt-12">
          <h2 className="text-2xl font-bold mb-8">Priority Summary</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* V1 Priority */}
            <div className="border border-emerald-600 rounded-lg bg-emerald-900/20 p-6">
              <h3 className="font-bold text-emerald-100 mb-4">🚀 V1 Priority (August 2026)</h3>
              <ul className="text-sm text-emerald-100/80 space-y-2">
                {SPORTS_CALENDAR.filter((e) => e.priority === "v1")
                  .map((e) => (
                    <li key={e.name}>• {e.name}</li>
                  ))}
              </ul>
            </div>

            {/* Phase 2 */}
            <div className="border border-blue-600 rounded-lg bg-blue-900/20 p-6">
              <h3 className="font-bold text-blue-100 mb-4">📅 Phase 2 (Q4 2026–2027)</h3>
              <ul className="text-sm text-blue-100/80 space-y-2">
                {SPORTS_CALENDAR.filter((e) => e.priority === "phase2")
                  .slice(0, 8)
                  .map((e) => (
                    <li key={e.name}>• {e.name}</li>
                  ))}
                <li className="italic text-blue-100/60">+ {SPORTS_CALENDAR.filter((e) => e.priority === "phase2").length - 8} more</li>
              </ul>
            </div>

            {/* Future */}
            <div className="border border-slate-600 rounded-lg bg-slate-800/20 p-6">
              <h3 className="font-bold text-slate-300 mb-4">🔮 Future (2027+)</h3>
              <ul className="text-sm text-slate-300/80 space-y-2">
                {SPORTS_CALENDAR.filter((e) => e.priority === "future")
                  .slice(0, 8)
                  .map((e) => (
                    <li key={e.name}>• {e.name}</li>
                  ))}
                <li className="italic text-slate-300/60">+ {SPORTS_CALENDAR.filter((e) => e.priority === "future").length - 8} more</li>
              </ul>
            </div>
          </div>

          {/* Key Notes */}
          <div className="bg-[var(--color-surface-2)] rounded-lg p-6 border border-[var(--color-card-border)]">
            <h3 className="font-bold mb-4">📌 Key Planning Notes</h3>
            <ul className="text-sm text-[var(--color-text-muted)] space-y-3">
              <li>
                <strong>August 2026:</strong> NFL preseason + college football start. V1 event sourcing must be ready for these two.
              </li>
              <li>
                <strong>November 2026:</strong> College basketball + World Cup 2026 (if we can get ready in time). Stretch goal.
              </li>
              <li>
                <strong>December 2026 – March 2027:</strong> Peak sports season. NFL playoffs, college basketball, March Madness. Heavy engagement period.
              </li>
              <li>
                <strong>April onwards:</strong> NBA/NHL playoffs, baseball season ramps. Transition to summer sports.
              </li>
              <li>
                <strong>Phase 2 scope:</strong> European soccer (Premier League, La Liga, etc.), NBA, NHL, major golf tournaments, tennis Grand Slams.
              </li>
              <li>
                <strong>Future scope:</strong> Combat sports, cricket, rugby, Formula 1, horse racing, cycling, Olympics.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
