import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { MockAdapter } from "@thecard/exchange-client";

const exchange = new MockAdapter();

const app = new Hono();

app.use("*", logger());
app.use("*", cors({ origin: ["http://localhost:3000"] }));

app.get("/health", (c) => c.json({ status: "ok" }));

app.get("/markets", async (c) => {
  const sport = c.req.query("sport") as string | undefined;
  const limit = c.req.query("limit");
  const markets = await exchange.getMarkets({
    sport: sport as any,
    limit: limit ? Number(limit) : undefined,
  });
  return c.json(markets);
});

app.get("/markets/:id", async (c) => {
  const market = await exchange.getMarket(c.req.param("id"));
  if (!market) return c.json({ error: "Not found" }, 404);
  return c.json(market);
});

app.get("/markets/:id/odds", async (c) => {
  const odds = await exchange.getOdds(c.req.param("id"));
  if (!odds) return c.json({ error: "Not found" }, 404);
  return c.json(odds);
});

const PORT = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
