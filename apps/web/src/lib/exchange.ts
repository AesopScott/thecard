import { MockAdapter } from "@thecard/exchange-client";
import type { ExchangeAdapter } from "@thecard/exchange-client";

function createAdapter(): ExchangeAdapter {
  const provider = process.env.NEXT_PUBLIC_EXCHANGE_PROVIDER ?? "mock";

  switch (provider) {
    case "kalshi":
      // KalshiAdapter imported dynamically when built
      throw new Error("KalshiAdapter not yet implemented — awaiting approval");
    case "polymarket":
      throw new Error("PolymarketAdapter not yet implemented");
    case "mock":
    default:
      return new MockAdapter();
  }
}

export const exchange: ExchangeAdapter = createAdapter();
