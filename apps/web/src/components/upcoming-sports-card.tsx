import Link from "next/link";

const UPCOMING_SPORTS = [
  { name: "NFL Preseason", month: "August", icon: "🏈" },
  { name: "College Football", month: "September", icon: "🏈" },
  { name: "College Basketball", month: "November", icon: "🏀" },
  { name: "March Madness", month: "March", icon: "🏀" },
];

export function UpcomingSportsCard() {
  return (
    <Link href="/sports-calendar">
      <div className="rounded-xl border border-[var(--color-brand-primary)]/30 bg-gradient-to-br from-[var(--color-surface-2)] to-[var(--color-background)] p-5 flex flex-col gap-4 hover:border-[var(--color-brand-primary)]/60 transition-all cursor-pointer group">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-[var(--color-brand-primary)] uppercase tracking-widest">
              📅 Upcoming Sports
            </p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Plan your forecasts around the season calendar
            </p>
          </div>
          <span className="text-2xl group-hover:scale-110 transition-transform">📅</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {UPCOMING_SPORTS.map((sport) => (
            <div
              key={sport.name}
              className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-card-surface)] border border-[var(--color-card-border)] group-hover:border-[var(--color-brand-primary)]/40 transition-colors"
            >
              <span className="text-xl">{sport.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                  {sport.name}
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">{sport.month}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-[var(--color-brand-primary)] font-semibold group-hover:underline">
          View full calendar →
        </div>
      </div>
    </Link>
  );
}
