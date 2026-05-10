import type { SportLeague } from "@thecard/types";

const d = (y: number, m: number, day: number) => new Date(y, m, day);

export const SPORT_LEAGUES: SportLeague[] = [
  // ── NFL ──────────────────────────────────────────────────────────────────
  {
    id: "nfl-2026-full",
    sport: "nfl",
    name: "NFL Full Season",
    description: "Hall of Fame Game through Super Bowl LXI",
    type: "sport_season",
    startDate: d(2026, 7, 6),   // Aug 6
    endDate: d(2027, 1, 1),     // Feb 1
    memberCount: 3_412,
  },
  {
    id: "nfl-2026-regular",
    sport: "nfl",
    name: "NFL Regular Season",
    description: "17 weeks of regular-season football only",
    type: "sport_season",
    startDate: d(2026, 8, 3),   // Sep 3
    endDate: d(2027, 0, 3),     // Jan 3
    memberCount: 2_891,
  },
  {
    id: "nfl-2026-h1",
    sport: "nfl",
    name: "NFL First Half",
    description: "Weeks 1–9 (Sep 3 – Nov 2)",
    type: "sport_half_season",
    half: "first",
    startDate: d(2026, 8, 3),   // Sep 3
    endDate: d(2026, 10, 2),    // Nov 2
    memberCount: 1_544,
  },
  {
    id: "nfl-2026-h2",
    sport: "nfl",
    name: "NFL Second Half",
    description: "Weeks 10–18 (Nov 3 – Jan 3)",
    type: "sport_half_season",
    half: "second",
    startDate: d(2026, 10, 3),  // Nov 3
    endDate: d(2027, 0, 3),     // Jan 3
    memberCount: 1_287,
  },
  {
    id: "nfl-2026-playoffs",
    sport: "nfl",
    name: "NFL Playoffs",
    description: "Wild Card Weekend through Super Bowl LXI",
    type: "sport_playoffs",
    startDate: d(2027, 0, 10),  // Jan 10
    endDate: d(2027, 1, 1),     // Feb 1
    memberCount: 2_103,
  },

  // ── College Football ─────────────────────────────────────────────────────
  {
    id: "ncaaf-2026-full",
    sport: "ncaaf",
    name: "CFB Full Season",
    description: "Week 0 through CFP National Championship",
    type: "sport_season",
    startDate: d(2026, 7, 22),  // Aug 22
    endDate: d(2027, 0, 19),    // Jan 19
    memberCount: 1_876,
  },
  {
    id: "ncaaf-2026-regular",
    sport: "ncaaf",
    name: "CFB Regular Season",
    description: "Week 0 through Conference Championship Games",
    type: "sport_season",
    startDate: d(2026, 7, 22),  // Aug 22
    endDate: d(2026, 11, 6),    // Dec 6
    memberCount: 1_203,
  },
  {
    id: "ncaaf-2026-playoff",
    sport: "ncaaf",
    name: "College Football Playoff",
    description: "12-team CFP — First Round through Championship",
    type: "sport_playoffs",
    startDate: d(2026, 11, 19), // Dec 19
    endDate: d(2027, 0, 19),    // Jan 19
    memberCount: 1_544,
  },

  // ── NBA ──────────────────────────────────────────────────────────────────
  {
    id: "nba-2026-full",
    sport: "nba",
    name: "NBA Full Season",
    description: "Opening night through NBA Finals",
    type: "sport_season",
    startDate: d(2026, 9, 22),  // Oct 22
    endDate: d(2027, 5, 30),    // Jun 30
    memberCount: 2_654,
  },
  {
    id: "nba-2026-regular",
    sport: "nba",
    name: "NBA Regular Season",
    description: "82-game regular season only",
    type: "sport_season",
    startDate: d(2026, 9, 22),  // Oct 22
    endDate: d(2027, 3, 12),    // Apr 12
    memberCount: 1_987,
  },
  {
    id: "nba-2026-h1",
    sport: "nba",
    name: "NBA First Half",
    description: "Opening night through mid-January",
    type: "sport_half_season",
    half: "first",
    startDate: d(2026, 9, 22),  // Oct 22
    endDate: d(2027, 0, 14),    // Jan 14
    memberCount: 1_123,
  },
  {
    id: "nba-2026-h2",
    sport: "nba",
    name: "NBA Second Half",
    description: "Mid-January through end of regular season",
    type: "sport_half_season",
    half: "second",
    startDate: d(2027, 0, 15),  // Jan 15
    endDate: d(2027, 3, 12),    // Apr 12
    memberCount: 876,
  },
  {
    id: "nba-2026-playoffs",
    sport: "nba",
    name: "NBA Playoffs",
    description: "Play-In Tournament through NBA Finals",
    type: "sport_playoffs",
    startDate: d(2027, 3, 15),  // Apr 15
    endDate: d(2027, 5, 30),    // Jun 30
    memberCount: 1_765,
  },

  // ── MLB ──────────────────────────────────────────────────────────────────
  {
    id: "mlb-2026-full",
    sport: "mlb",
    name: "MLB Full Season",
    description: "Opening Day through World Series",
    type: "sport_season",
    startDate: d(2026, 2, 26),  // Mar 26
    endDate: d(2026, 10, 1),    // Nov 1
    memberCount: 1_432,
  },
  {
    id: "mlb-2026-h1",
    sport: "mlb",
    name: "MLB First Half",
    description: "Opening Day through All-Star break",
    type: "sport_half_season",
    half: "first",
    startDate: d(2026, 2, 26),  // Mar 26
    endDate: d(2026, 6, 13),    // Jul 13
    memberCount: 876,
  },
  {
    id: "mlb-2026-h2",
    sport: "mlb",
    name: "MLB Second Half",
    description: "Post-All-Star through end of regular season",
    type: "sport_half_season",
    half: "second",
    startDate: d(2026, 6, 14),  // Jul 14
    endDate: d(2026, 8, 28),    // Sep 28
    memberCount: 654,
  },
  {
    id: "mlb-2026-postseason",
    sport: "mlb",
    name: "MLB Postseason",
    description: "Wild Card through World Series",
    type: "sport_playoffs",
    startDate: d(2026, 8, 29),  // Sep 29
    endDate: d(2026, 10, 1),    // Nov 1
    memberCount: 1_102,
  },

  // ── NHL ──────────────────────────────────────────────────────────────────
  {
    id: "nhl-2026-full",
    sport: "nhl",
    name: "NHL Full Season",
    description: "Opening night through Stanley Cup Finals",
    type: "sport_season",
    startDate: d(2026, 9, 7),   // Oct 7
    endDate: d(2027, 5, 30),    // Jun 30
    memberCount: 987,
  },
  {
    id: "nhl-2026-regular",
    sport: "nhl",
    name: "NHL Regular Season",
    description: "82-game regular season only",
    type: "sport_season",
    startDate: d(2026, 9, 7),   // Oct 7
    endDate: d(2027, 3, 17),    // Apr 17
    memberCount: 743,
  },
  {
    id: "nhl-2026-playoffs",
    sport: "nhl",
    name: "Stanley Cup Playoffs",
    description: "First Round through Stanley Cup Finals",
    type: "sport_playoffs",
    startDate: d(2027, 3, 21),  // Apr 21
    endDate: d(2027, 5, 30),    // Jun 30
    memberCount: 876,
  },

  // ── College Basketball ───────────────────────────────────────────────────
  {
    id: "ncaab-2026-full",
    sport: "ncaab",
    name: "CBB Full Season",
    description: "Season Tipoff through National Championship",
    type: "sport_season",
    startDate: d(2026, 10, 10), // Nov 10
    endDate: d(2027, 3, 6),     // Apr 6
    memberCount: 1_234,
  },
  {
    id: "ncaab-2027-tournament",
    sport: "ncaab",
    name: "March Madness",
    description: "Selection Sunday through National Championship",
    type: "sport_tournament",
    startDate: d(2027, 2, 14),  // Mar 14
    endDate: d(2027, 3, 6),     // Apr 6
    memberCount: 2_876,
  },

  // ── Soccer ───────────────────────────────────────────────────────────────
  {
    id: "soccer-2026-pl",
    sport: "soccer",
    name: "Premier League",
    description: "All 38 matchdays of the 2026–27 season",
    type: "sport_season",
    startDate: d(2026, 7, 15),  // Aug 15
    endDate: d(2027, 4, 23),    // May 23
    memberCount: 1_654,
  },
  {
    id: "soccer-2026-pl-h1",
    sport: "soccer",
    name: "Premier League First Half",
    description: "Matchdays 1–19 (Aug 15 – Dec 31)",
    type: "sport_half_season",
    half: "first",
    startDate: d(2026, 7, 15),  // Aug 15
    endDate: d(2026, 11, 31),   // Dec 31
    memberCount: 876,
  },
  {
    id: "soccer-2026-pl-h2",
    sport: "soccer",
    name: "Premier League Second Half",
    description: "Matchdays 20–38 (Jan 1 – May 23)",
    type: "sport_half_season",
    half: "second",
    startDate: d(2027, 0, 1),   // Jan 1
    endDate: d(2027, 4, 23),    // May 23
    memberCount: 654,
  },
  {
    id: "soccer-2026-ucl",
    sport: "soccer",
    name: "Champions League",
    description: "League phase through the Final",
    type: "sport_season",
    startDate: d(2026, 8, 16),  // Sep 16
    endDate: d(2027, 4, 29),    // May 29
    memberCount: 1_321,
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

export interface SportGroup {
  sport: string;
  icon: string;
  label: string;
  leagues: SportLeague[];
}

const SPORT_META: Record<string, { icon: string; label: string; order: number }> = {
  nfl:    { icon: "🏈", label: "NFL", order: 1 },
  ncaaf:  { icon: "🏈", label: "College Football", order: 2 },
  nba:    { icon: "🏀", label: "NBA", order: 3 },
  mlb:    { icon: "⚾", label: "MLB", order: 4 },
  nhl:    { icon: "🏒", label: "NHL", order: 5 },
  ncaab:  { icon: "🏀", label: "College Basketball", order: 6 },
  soccer: { icon: "⚽", label: "Soccer", order: 7 },
};

export function getLeaguesByGroup(): SportGroup[] {
  const map = new Map<string, SportLeague[]>();
  for (const league of SPORT_LEAGUES) {
    const group = map.get(league.sport) ?? [];
    group.push(league);
    map.set(league.sport, group);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (SPORT_META[a]?.order ?? 99) - (SPORT_META[b]?.order ?? 99))
    .map(([sport, leagues]) => ({
      sport,
      icon: SPORT_META[sport]?.icon ?? "🏅",
      label: SPORT_META[sport]?.label ?? sport,
      leagues,
    }));
}

export function leagueTypeBadge(type: SportLeague["type"], half?: SportLeague["half"]): string {
  if (type === "sport_half_season") return half === "first" ? "1st Half" : "2nd Half";
  if (type === "sport_playoffs") return "Playoffs";
  if (type === "sport_tournament") return "Tournament";
  return "Full Season";
}

export function formatLeagueDateRange(league: SportLeague): string {
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${fmt(league.startDate)} – ${fmt(league.endDate)}`;
}

export function getLeagueStatus(league: SportLeague): "upcoming" | "active" | "closed" {
  const now = Date.now();
  if (now < league.startDate.getTime()) return "upcoming";
  if (now > league.endDate.getTime()) return "closed";
  return "active";
}
