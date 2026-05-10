import type {
  Fill,
  Market,
  MarketFilter,
  Odds,
  Order,
  Position,
} from "@thecard/types";
import type { ExchangeAdapter, OddsCallback, Unsubscribe } from "../adapter";

const MOCK_MARKETS: Market[] = [
  {
    id: "mock-nfl-01",
    title: "Chiefs to win Super Bowl LXI",
    subtitle: "Kansas City Chiefs",
    sport: "nfl",
    status: "open",
    closesAt: new Date("2027-02-01T23:30:00Z"),
    resolvedAt: null,
    outcome: null,
    externalId: null,
  },
  {
    id: "mock-nfl-02",
    title: "Mahomes 300+ passing yards vs Raiders",
    subtitle: "Sunday Night Football · Sep 14",
    sport: "nfl",
    status: "open",
    closesAt: new Date("2026-09-14T23:00:00Z"),
    resolvedAt: null,
    outcome: null,
    externalId: null,
  },
  {
    id: "mock-nba-01",
    title: "Lakers to win NBA Championship",
    subtitle: "Los Angeles Lakers",
    sport: "nba",
    status: "open",
    closesAt: new Date("2027-06-20T23:00:00Z"),
    resolvedAt: null,
    outcome: null,
    externalId: null,
  },
  {
    id: "mock-ufc-01",
    title: "Jones to retain heavyweight title",
    subtitle: "UFC 315 Main Event",
    sport: "ufc",
    status: "open",
    closesAt: new Date("2026-05-17T03:00:00Z"),
    resolvedAt: null,
    outcome: null,
    externalId: null,
  },
  {
    id: "mock-nfl-03",
    title: "Eagles to cover -3.5 vs Cowboys",
    subtitle: "NFC East Rivalry · Sep 21",
    sport: "nfl",
    status: "open",
    closesAt: new Date("2026-09-21T20:15:00Z"),
    resolvedAt: null,
    outcome: null,
    externalId: null,
  },
  {
    id: "mock-mlb-01",
    title: "Yankees to win the 2026 World Series",
    subtitle: "New York Yankees",
    sport: "mlb",
    status: "open",
    closesAt: new Date("2026-11-01T04:00:00Z"),
    resolvedAt: null,
    outcome: null,
    externalId: null,
  },
  {
    id: "mock-ncaaf-01",
    title: "Georgia to win CFP National Championship",
    subtitle: "College Football Playoff",
    sport: "ncaaf",
    status: "open",
    closesAt: new Date("2027-01-19T02:00:00Z"),
    resolvedAt: null,
    outcome: null,
    externalId: null,
  },
  {
    id: "mock-soccer-01",
    title: "Man City to win Premier League",
    subtitle: "2026–27 Premier League",
    sport: "soccer",
    status: "open",
    closesAt: new Date("2027-05-23T17:00:00Z"),
    resolvedAt: null,
    outcome: null,
    externalId: null,
  },
  {
    id: "mock-ncaab-01",
    title: "Duke to win March Madness",
    subtitle: "NCAA Tournament 2027",
    sport: "ncaab",
    status: "open",
    closesAt: new Date("2027-04-06T02:00:00Z"),
    resolvedAt: null,
    outcome: null,
    externalId: null,
  },
  {
    id: "mock-nhl-01",
    title: "Maple Leafs to win Stanley Cup",
    subtitle: "Toronto Maple Leafs",
    sport: "nhl",
    status: "open",
    closesAt: new Date("2027-06-20T04:00:00Z"),
    resolvedAt: null,
    outcome: null,
    externalId: null,
  },
];

const MOCK_ODDS: Record<string, Odds> = {
  "mock-nfl-01":    { marketId: "mock-nfl-01",    yes: 0.62, no: 0.38, spread: 0.02, timestamp: new Date() },
  "mock-nfl-02":    { marketId: "mock-nfl-02",    yes: 0.54, no: 0.46, spread: 0.02, timestamp: new Date() },
  "mock-nba-01":    { marketId: "mock-nba-01",    yes: 0.18, no: 0.82, spread: 0.03, timestamp: new Date() },
  "mock-ufc-01":    { marketId: "mock-ufc-01",    yes: 0.71, no: 0.29, spread: 0.02, timestamp: new Date() },
  "mock-nfl-03":    { marketId: "mock-nfl-03",    yes: 0.48, no: 0.52, spread: 0.02, timestamp: new Date() },
  "mock-mlb-01":    { marketId: "mock-mlb-01",    yes: 0.14, no: 0.86, spread: 0.02, timestamp: new Date() },
  "mock-ncaaf-01":  { marketId: "mock-ncaaf-01",  yes: 0.22, no: 0.78, spread: 0.02, timestamp: new Date() },
  "mock-soccer-01": { marketId: "mock-soccer-01", yes: 0.31, no: 0.69, spread: 0.02, timestamp: new Date() },
  "mock-ncaab-01":  { marketId: "mock-ncaab-01",  yes: 0.09, no: 0.91, spread: 0.02, timestamp: new Date() },
  "mock-nhl-01":    { marketId: "mock-nhl-01",    yes: 0.08, no: 0.92, spread: 0.02, timestamp: new Date() },
};

export class MockAdapter implements ExchangeAdapter {
  private readonly positions = new Map<string, Position[]>();
  private readonly intervals = new Map<string, ReturnType<typeof setInterval>>();

  async getMarkets(filter?: MarketFilter): Promise<Market[]> {
    let markets = [...MOCK_MARKETS];
    if (filter?.sport) {
      markets = markets.filter((m) => m.sport === filter.sport);
    }
    if (filter?.status) {
      markets = markets.filter((m) => m.status === filter.status);
    }
    if (filter?.limit) {
      markets = markets.slice(0, filter.limit);
    }
    return markets;
  }

  async getMarket(id: string): Promise<Market | null> {
    return MOCK_MARKETS.find((m) => m.id === id) ?? null;
  }

  async getOdds(marketId: string): Promise<Odds | null> {
    return MOCK_ODDS[marketId] ?? null;
  }

  async placeOrder(userId: string, order: Order): Promise<Fill> {
    const odds = MOCK_ODDS[order.marketId];
    const price = order.side === "yes" ? (odds?.yes ?? 0.5) : (odds?.no ?? 0.5);
    const fill: Fill = {
      orderId: `fill-${Date.now()}`,
      marketId: order.marketId,
      side: order.side,
      filledAmountUsd: order.amountUsd,
      price,
      timestamp: new Date(),
    };

    const existing = this.positions.get(userId) ?? [];
    const position: Position = {
      userId,
      marketId: order.marketId,
      side: order.side,
      contracts: order.amountUsd / price,
      averagePrice: price,
      currentValue: order.amountUsd,
      pnl: 0,
    };
    this.positions.set(userId, [...existing, position]);

    return fill;
  }

  async getPositions(userId: string): Promise<Position[]> {
    return this.positions.get(userId) ?? [];
  }

  subscribeToMarket(marketId: string, cb: OddsCallback): Unsubscribe {
    const interval = setInterval(() => {
      const base = MOCK_ODDS[marketId];
      if (!base) return;
      const drift = (Math.random() - 0.5) * 0.02;
      const yes = Math.max(0.01, Math.min(0.99, base.yes + drift));
      cb({ marketId, yes, no: 1 - yes, spread: base.spread, timestamp: new Date() });
    }, 3000);

    this.intervals.set(marketId, interval);
    return () => {
      clearInterval(interval);
      this.intervals.delete(marketId);
    };
  }
}
