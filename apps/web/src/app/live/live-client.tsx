"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";

// ── Mock data ──────────────────────────────────────────────────────────────

interface Game {
  id: string;
  away: string; awayScore: number; awayRecord: string;
  home: string; homeScore: number; homeRecord: string;
  period: string; clock: string;
  status: "live" | "upcoming" | "final";
  kickoff?: string;
}

interface MicroMarket {
  id: string; title: string; baseYes: number;
  trend: "up" | "down" | "flat"; closesIn: string;
}

interface CommentaryItem {
  id: string; time: string; text: string; oddsRef?: string;
}

const GAMES: Game[] = [
  { id: "kc-sf", away: "KC", awayScore: 17, awayRecord: "11-3", home: "SF", homeScore: 14, homeRecord: "10-4", period: "Q3", clock: "8:42", status: "live" },
  { id: "dal-phi", away: "DAL", awayScore: 0, awayRecord: "7-7", home: "PHI", homeScore: 0, homeRecord: "12-2", period: "—", clock: "8:20 PM", status: "upcoming", kickoff: "Tonight" },
  { id: "buf-mia", away: "BUF", awayScore: 27, awayRecord: "11-3", home: "MIA", homeScore: 20, homeRecord: "8-6", period: "FINAL", clock: "", status: "final" },
];

const MICRO_MARKETS: MicroMarket[] = [
  { id: "mm1", title: "Next score: Chiefs TD", baseYes: 0.45, trend: "up",   closesIn: "2:34" },
  { id: "mm2", title: "Chiefs win by 7+",      baseYes: 0.38, trend: "flat", closesIn: "game" },
  { id: "mm3", title: "Total points over 47.5", baseYes: 0.61, trend: "up",  closesIn: "game" },
  { id: "mm4", title: "49ers cover +3.5",       baseYes: 0.44, trend: "down", closesIn: "game" },
];

const COMMENTARY: CommentaryItem[] = [
  { id: "c1", time: "8:42 Q3", text: "Mahomes just converted on 3rd-and-8 — Chiefs are 71% to win and climbing. The 49ers pass rush hasn't touched him since halftime.", oddsRef: "71¢ YES" },
  { id: "c2", time: "11:05 Q3", text: "SF scored to cut it to 17–14. Watch the total — 31 points through three quarters with the over at 47.5. Needs 17 more in one quarter. Lean under.", oddsRef: "over 61¢" },
  { id: "c3", time: "14:22 Q3", text: "Chiefs opened this half at 64¢. The Kelce touchdown moved them to 76¢ briefly before the 49ers answered. Now sitting at 71¢ — the market isn't convinced either way.", oddsRef: "71¢ YES" },
  { id: "c4", time: "Halftime", text: "49ers held to a field goal on four red zone plays. That inefficiency is priced in — Chiefs came out at 64¢ to start the half. If SF's offense doesn't wake up in Q3, this moves fast.", oddsRef: "64¢ YES" },
];

// ── Sub-components ─────────────────────────────────────────────────────────

function LivePulse() {
  return (
    <span className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-card-yes)] opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-card-yes)]" />
      </span>
      <span className="text-[10px] font-bold text-[var(--color-card-yes)] uppercase tracking-widest">Live</span>
    </span>
  );
}

function GameChip({ game, selected, onClick }: { game: Game; selected: boolean; onClick: () => void }) {
  const isLive = game.status === "live";
  const isFinal = game.status === "final";

  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 rounded-xl border p-3 flex flex-col gap-1 min-w-[120px] transition-colors text-left ${
        selected
          ? "border-[var(--color-card-accent)] bg-[var(--color-card-accent-dim)]"
          : "border-[var(--color-card-border)] bg-[var(--color-card-surface)] hover:border-[var(--color-card-muted)]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-black text-[var(--color-card-text)]">{game.away}</span>
        <span className={`text-xs font-black ${isFinal ? "text-[var(--color-card-muted)]" : "text-[var(--color-card-text)]"}`}>
          {game.awayScore}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-black text-[var(--color-card-text)]">{game.home}</span>
        <span className={`text-xs font-black ${isFinal ? "text-[var(--color-card-muted)]" : "text-[var(--color-card-text)]"}`}>
          {game.homeScore}
        </span>
      </div>
      <div className="mt-0.5">
        {isLive && (
          <span className="text-[9px] font-bold text-[var(--color-card-yes)] uppercase tracking-wider">
            {game.period} · {game.clock}
          </span>
        )}
        {game.status === "upcoming" && (
          <span className="text-[9px] font-medium text-[var(--color-card-muted)]">{game.clock}</span>
        )}
        {isFinal && (
          <span className="text-[9px] font-medium text-[var(--color-card-muted)]">Final</span>
        )}
      </div>
    </button>
  );
}

function Scoreboard({ game }: { game: Game }) {
  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const currentQ = parseInt(game.period.replace("Q", "")) - 1;

  return (
    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <LivePulse />
        <span className="text-xs text-[var(--color-card-muted)]">{game.period} · {game.clock} remaining</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-3xl font-black text-[var(--color-card-text)]">{game.awayScore}</span>
          <span className="text-sm font-bold text-[var(--color-card-muted)]">{game.away}</span>
          <span className="text-[10px] text-[var(--color-card-muted)]">{game.awayRecord}</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-[var(--color-card-muted)]">vs</span>
          <div className="flex gap-1">
            {quarters.map((q, i) => (
              <div
                key={q}
                className={`w-5 h-1.5 rounded-full ${
                  i < currentQ ? "bg-[var(--color-card-accent)]"
                  : i === currentQ ? "bg-[var(--color-card-accent)] opacity-50"
                  : "bg-[var(--color-card-border)]"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <span className="text-3xl font-black text-[var(--color-card-text)]">{game.homeScore}</span>
          <span className="text-sm font-bold text-[var(--color-card-muted)]">{game.home}</span>
          <span className="text-[10px] text-[var(--color-card-muted)]">{game.homeRecord}</span>
        </div>
      </div>
    </div>
  );
}

function MainMarket({ yes }: { yes: number }) {
  const yesPct = Math.round(yes * 100);
  const noPct = 100 - yesPct;

  return (
    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--color-card-muted)] uppercase tracking-widest">Chiefs to win</span>
        <LivePulse />
      </div>

      {/* Odds bar */}
      <div className="flex rounded-lg overflow-hidden h-10 text-sm font-black">
        <div
          className="flex items-center justify-center bg-[var(--color-card-yes)] text-white transition-all duration-1000"
          style={{ width: `${yesPct}%` }}
        >
          YES {yesPct}¢
        </div>
        <div
          className="flex items-center justify-center bg-[var(--color-card-no)] text-white transition-all duration-1000"
          style={{ width: `${noPct}%` }}
        >
          NO {noPct}¢
        </div>
      </div>

      <p className="text-xs text-[var(--color-card-muted)]">
        The market gives Kansas City a <strong className="text-[var(--color-card-text)]">{yesPct}% chance</strong> to win — up from 62% at kickoff.
      </p>

      <div className="flex gap-2">
        <BetButton side="yes" cents={yesPct} />
        <BetButton side="no" cents={noPct} />
      </div>
    </div>
  );
}

function BetButton({ side, cents }: { side: "yes" | "no"; cents: number }) {
  const { user } = useAuth();
  const [tapped, setTapped] = useState(false);

  function handleTap() {
    if (!user) return;
    setTapped(true);
    setTimeout(() => setTapped(false), 800);
  }

  const isYes = side === "yes";
  const base = isYes
    ? "bg-[var(--color-card-yes-dim)] border-[var(--color-card-yes)] text-[var(--color-card-yes)]"
    : "bg-[var(--color-card-no-dim)] border-[var(--color-card-no)] text-[var(--color-card-no)]";

  return (
    <button
      onClick={handleTap}
      className={`flex-1 border rounded-lg py-2.5 text-sm font-black transition-opacity ${base} ${tapped ? "opacity-50" : "opacity-100"}`}
    >
      {tapped ? "✓ Added" : `${isYes ? "YES" : "NO"} · ${cents}¢`}
    </button>
  );
}

function MicroMarketCard({ market, yes }: { market: MicroMarket; yes: number }) {
  const yesPct = Math.round(yes * 100);
  const isUp = market.trend === "up";
  const isDown = market.trend === "down";

  return (
    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-3 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold text-[var(--color-card-text)] leading-snug">{market.title}</span>
        <span className={`text-[10px] font-bold flex-shrink-0 ${
          isUp ? "text-[var(--color-card-yes)]" : isDown ? "text-[var(--color-card-no)]" : "text-[var(--color-card-muted)]"
        }`}>
          {isUp ? "▲" : isDown ? "▼" : "—"} {isUp ? "rising" : isDown ? "falling" : "stable"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-[var(--color-card-border)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--color-card-yes)] transition-all duration-1000"
            style={{ width: `${yesPct}%` }}
          />
        </div>
        <span className="text-xs font-bold text-[var(--color-card-text)] w-8 text-right">{yesPct}¢</span>
      </div>

      <div className="flex gap-1.5">
        <BetButton side="yes" cents={yesPct} />
        <BetButton side="no" cents={100 - yesPct} />
      </div>

      {market.closesIn !== "game" && (
        <span className="text-[10px] text-[var(--color-card-muted)]">⚡ Closes in {market.closesIn}</span>
      )}
    </div>
  );
}

function CommentaryFeed({ items }: { items: CommentaryItem[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--color-card-muted)] uppercase tracking-widest">Host Commentary</span>
        <LivePulse />
      </div>
      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[var(--color-card-accent)] uppercase tracking-wider">{item.time}</span>
            {item.oddsRef && (
              <span className="text-[10px] text-[var(--color-card-muted)]">{item.oddsRef}</span>
            )}
          </div>
          <p className="text-sm text-[var(--color-card-text)] leading-relaxed">{item.text}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────

export function LiveClient() {
  const [selectedId, setSelectedId] = useState("kc-sf");
  const [mainYes, setMainYes] = useState(0.71);
  const [microYes, setMicroYes] = useState(MICRO_MARKETS.map((m) => m.baseYes));

  // Simulate live odds drift
  useEffect(() => {
    const interval = setInterval(() => {
      setMainYes((prev) => {
        const delta = (Math.random() - 0.48) * 0.012;
        return Math.min(0.92, Math.max(0.52, prev + delta));
      });
      setMicroYes((prev) =>
        prev.map((y, i) => {
          const m = MICRO_MARKETS[i]!;
          const bias = m.trend === "up" ? 0.003 : m.trend === "down" ? -0.003 : 0;
          const delta = (Math.random() - 0.5) * 0.018 + bias;
          return Math.min(0.92, Math.max(0.08, y + delta));
        })
      );
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const selected = GAMES.find((g) => g.id === selectedId) ?? GAMES[0]!;
  const isLiveGame = selected.status === "live";

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-black tracking-tight text-[var(--color-card-text)]">Live</h1>
        <p className="text-sm text-[var(--color-card-muted)]">One game. Every market. In real time.</p>
      </header>

      {/* Game picker */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
        {GAMES.map((game) => (
          <GameChip
            key={game.id}
            game={game}
            selected={game.id === selectedId}
            onClick={() => setSelectedId(game.id)}
          />
        ))}
      </div>

      {isLiveGame ? (
        <>
          <Scoreboard game={selected} />
          <MainMarket yes={mainYes} />

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[var(--color-card-muted)] uppercase tracking-widest">
              In-play markets
            </span>
            <span className="text-[10px] text-[var(--color-card-muted)]">
              Fast-moving. Odds update with every play.
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {MICRO_MARKETS.map((market, i) => (
              <MicroMarketCard key={market.id} market={market} yes={microYes[i]!} />
            ))}
          </div>

          <CommentaryFeed items={COMMENTARY} />
        </>
      ) : (
        <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5 flex flex-col gap-2">
          <p className="text-sm font-semibold text-[var(--color-card-text)]">
            {selected.status === "upcoming" ? `${selected.away} vs ${selected.home} · ${selected.clock}` : `${selected.away} ${selected.awayScore} · ${selected.home} ${selected.homeScore} · Final`}
          </p>
          <p className="text-xs text-[var(--color-card-muted)]">
            {selected.status === "upcoming"
              ? "Live mode activates when the game kicks off. Check back then."
              : "This game has ended. Pick a live game above to see real-time markets."}
          </p>
        </div>
      )}
    </div>
  );
}
