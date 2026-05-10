import Anthropic from "@anthropic-ai/sdk";
import type { Market, Odds } from "@thecard/types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Module-level cache — scoped to this server instance, TTL 1 hour
const cache = new Map<string, { take: string; cachedAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

const SYSTEM_PROMPT = `You are the editorial voice for The Card — a curated, fan-first prediction market app.
Your job is to write sharp, opinionated host takes on prediction markets for sports fans.

Rules:
- Exactly 2 sentences. No more.
- Be direct and take a position. Do not hedge.
- Reference the specific price or probability if it supports your take.
- Write like a sharp analyst at The Athletic, not a finance desk.
- No jargon: say "the market thinks" not "implied probability."
- Do not start with "I" or the market title.
- End with a recommendation or a sharp observation, not a question.

Bad example: "This is an interesting market with a lot of factors at play. It could go either way."
Good example: "At 62 cents, the market is giving the Chiefs more credit than their offensive line deserves right now. Fade this to 50 and don't look back."`;

function getCacheKey(market: Market, odds: Odds): string {
  // Bucket by 5% increments so minor drift doesn't bust the cache
  const oddsKey = Math.round(odds.yes * 20);
  return `${market.id}:${oddsKey}`;
}

export interface HostTake {
  text: string;
  source: "claude" | "fallback";
}

const FALLBACKS: Record<string, string> = {
  "mock-nfl-01":
    "At 62 cents, the market is giving the Chiefs more credit than their offensive line deserves heading into the playoffs. If Mahomes takes more than two sacks in the first round, this number collapses fast.",
  "mock-nfl-02":
    "Mahomes has cleared 300 passing yards in five of his last seven starts against AFC West opponents — the Raiders just don't have the secondary to stop him. Take YES and don't overthink it.",
  "mock-nba-01":
    "Eighteen cents on the Lakers is the market saying they're a long shot, and the market is right — their third-quarter defensive rating is the worst in the conference. Pass.",
  "mock-ufc-01":
    "Jones at 71 cents feels right. His last three opponents ran the same game plan — pressure the clinch, tire him out — and all three lost. Bet the chalk.",
  "mock-nfl-03":
    "Eagles covering minus-three-and-a-half against a Cowboys team playing out the string is practically a gift. Philadelphia is 8-2-1 against the spread in divisional games this season.",
};

export async function getHostTake(
  market: Market,
  odds: Odds
): Promise<HostTake> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      text: FALLBACKS[market.id] ?? "No take available for this market.",
      source: "fallback",
    };
  }

  const key = getCacheKey(market, odds);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return { text: cached.take, source: "claude" };
  }

  try {
    const yesPct = Math.round(odds.yes * 100);
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 120,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          // @ts-expect-error — cache_control is valid but not yet in SDK types
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Market: ${market.title}\nContext: ${market.subtitle}\nCurrent price: YES at ${yesPct} cents (${yesPct}% probability)`,
        },
      ],
    });

    const block = response.content[0];
    const text = block?.type === "text" ? block.text.trim() : "";

    if (text) {
      cache.set(key, { take: text, cachedAt: Date.now() });
      return { text, source: "claude" };
    }
  } catch {
    // Fall through to fallback
  }

  return {
    text: FALLBACKS[market.id] ?? "No take available for this market.",
    source: "fallback",
  };
}

export async function getAllHostTakes(
  markets: Market[],
  oddsMap: Record<string, Odds>
): Promise<Record<string, HostTake>> {
  const entries = await Promise.all(
    markets.map(async (market) => {
      const odds = oddsMap[market.id];
      if (!odds) return [market.id, { text: "", source: "fallback" }] as const;
      const take = await getHostTake(market, odds);
      return [market.id, take] as const;
    })
  );
  return Object.fromEntries(entries);
}
