import type {
  Fill,
  Market,
  MarketFilter,
  Odds,
  Order,
  Position,
} from "@thecard/types";

export type OddsCallback = (odds: Odds) => void;
export type Unsubscribe = () => void;

export interface ExchangeAdapter {
  getMarkets(filter?: MarketFilter): Promise<Market[]>;
  getMarket(id: string): Promise<Market | null>;
  getOdds(marketId: string): Promise<Odds | null>;
  placeOrder(userId: string, order: Order): Promise<Fill>;
  getPositions(userId: string): Promise<Position[]>;
  subscribeToMarket(marketId: string, cb: OddsCallback): Unsubscribe;
}
