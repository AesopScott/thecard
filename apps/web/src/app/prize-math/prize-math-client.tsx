"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

interface LeagueScenario {
  name: string;
  sport: string;
  demandShare: number;
  monthsOpen: number;
  boost: number;
}

const DEFAULT_LEAGUES: LeagueScenario[] = [
  { name: "NFL Full Season", sport: "NFL", demandShare: 16, monthsOpen: 5, boost: 1.25 },
  { name: "NFL Regular Season", sport: "NFL", demandShare: 10, monthsOpen: 4, boost: 1 },
  { name: "College Football Full", sport: "CFB", demandShare: 8, monthsOpen: 5, boost: 0.95 },
  { name: "NBA Full Season", sport: "NBA", demandShare: 14, monthsOpen: 8, boost: 1.1 },
  { name: "NBA Playoffs", sport: "NBA", demandShare: 7, monthsOpen: 3, boost: 1.15 },
  { name: "MLB Full Season", sport: "MLB", demandShare: 12, monthsOpen: 8, boost: 1 },
  { name: "MLB Postseason", sport: "MLB", demandShare: 6, monthsOpen: 2, boost: 1.1 },
  { name: "NHL Full Season", sport: "NHL", demandShare: 7, monthsOpen: 8, boost: 0.8 },
  { name: "March Madness", sport: "CBB", demandShare: 8, monthsOpen: 1, boost: 1.35 },
  { name: "Premier League", sport: "Soccer", demandShare: 12, monthsOpen: 9, boost: 0.9 },
];

function currency(amount: number): string {
  return `$${Math.round(amount).toLocaleString()}`;
}

function percent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function PrizeMathClient() {
  const [paidMembers, setPaidMembers] = useState(2500);
  const [extraSlotsPerMember, setExtraSlotsPerMember] = useState(0.6);
  const [paidSlotUtilization, setPaidSlotUtilization] = useState(72);
  const [seasonMonths, setSeasonMonths] = useState(12);
  const [leaguePrizePercent, setLeaguePrizePercent] = useState(60);
  const [pickTenPercent, setPickTenPercent] = useState(10);

  const model = useMemo(() => {
    const subscriptionRevenue = paidMembers * 10;
    const extraSlotRevenue = paidMembers * extraSlotsPerMember * 2;
    const monthlyRevenue = subscriptionRevenue + extraSlotRevenue;
    const leaguePrizeBudget = monthlyRevenue * (leaguePrizePercent / 100);
    const pickTenBudget = monthlyRevenue * (pickTenPercent / 100);
    const flowThrough = monthlyRevenue - leaguePrizeBudget - pickTenBudget;
    const paidSlots = paidMembers * (3 + extraSlotsPerMember);
    const activePaidEntries = paidSlots * (paidSlotUtilization / 100);
    const totalDemand = DEFAULT_LEAGUES.reduce((sum, league) => sum + league.demandShare, 0);
    const totalWeight = DEFAULT_LEAGUES.reduce((sum, league) => (
      sum + league.demandShare * league.monthsOpen * league.boost
    ), 0);
    const leagues = DEFAULT_LEAGUES.map((league) => {
      const activeEntries = activePaidEntries * (league.demandShare / totalDemand);
      const weight = league.demandShare * league.monthsOpen * league.boost;
      const pool = totalWeight > 0 ? leaguePrizeBudget * (weight / totalWeight) : 0;
      return {
        ...league,
        activeEntries,
        weight,
        monthlyPool: pool,
        seasonPool: pool * Math.min(seasonMonths, league.monthsOpen),
        poolPerActiveEntry: activeEntries > 0 ? pool / activeEntries : 0,
      };
    });
    return {
      subscriptionRevenue,
      extraSlotRevenue,
      monthlyRevenue,
      leaguePrizeBudget,
      pickTenBudget,
      flowThrough,
      paidSlots,
      activePaidEntries,
      leagues,
      seasonRevenue: monthlyRevenue * seasonMonths,
      seasonLeaguePrizes: leaguePrizeBudget * seasonMonths,
      seasonPickTen: pickTenBudget * seasonMonths,
      seasonFlowThrough: flowThrough * seasonMonths,
    };
  }, [extraSlotsPerMember, leaguePrizePercent, paidMembers, paidSlotUtilization, pickTenPercent, seasonMonths]);

  return (
    <div className="min-h-screen bg-[var(--color-background)] px-4 pb-32 pt-8 text-[var(--color-text-primary)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/league-pass" className="text-sm font-bold text-[var(--color-brand-primary)] hover:underline">
            Back to League Pass
          </Link>
          <Link href="/leagues" className="text-sm font-bold text-[var(--color-card-muted)] hover:text-[var(--color-card-text)]">
            Leagues
          </Link>
        </div>

        <header className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Prize Math Simulator</p>
          <h1 className="mt-2 font-display text-4xl font-black text-[var(--color-card-text)]">Model the 60 / 10 / 30 split.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--color-card-muted)]">
            This is a planning tool for League Pass economics. Global gets status only, while paid league pools receive 60% of revenue, Pick 10 receives 10%, and 30% flows through to the platform.
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Assumptions</p>
            <div className="mt-4 flex flex-col gap-4">
              <NumberInput label="Paid members" value={paidMembers} min={0} step={100} onChange={setPaidMembers} />
              <NumberInput label="Extra slots per member" value={extraSlotsPerMember} min={0} step={0.1} onChange={setExtraSlotsPerMember} />
              <NumberInput label="Paid slot utilization %" value={paidSlotUtilization} min={0} max={100} step={1} onChange={setPaidSlotUtilization} />
              <NumberInput label="Season months" value={seasonMonths} min={1} max={12} step={1} onChange={setSeasonMonths} />
              <NumberInput label="Paid league prize %" value={leaguePrizePercent} min={0} max={100} step={1} onChange={setLeaguePrizePercent} />
              <NumberInput label="Pick 10 jackpot %" value={pickTenPercent} min={0} max={100} step={1} onChange={setPickTenPercent} />
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <Stat label="Monthly revenue" value={currency(model.monthlyRevenue)} />
              <Stat label="League prizes" value={currency(model.leaguePrizeBudget)} tone="good" />
              <Stat label="Pick 10" value={currency(model.pickTenBudget)} />
              <Stat label="Flow-through" value={currency(model.flowThrough)} tone={model.flowThrough >= 0 ? "neutral" : "bad"} />
            </div>

            <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Season totals</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <Stat label="Revenue" value={currency(model.seasonRevenue)} />
                <Stat label="League prizes" value={currency(model.seasonLeaguePrizes)} tone="good" />
                <Stat label="Pick 10 reserve" value={currency(model.seasonPickTen)} />
                <Stat label="Platform" value={currency(model.seasonFlowThrough)} tone={model.seasonFlowThrough >= 0 ? "neutral" : "bad"} />
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Slot demand</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Stat label="Paid slots available" value={Math.round(model.paidSlots).toLocaleString()} />
                <Stat label="Active paid entries" value={Math.round(model.activePaidEntries).toLocaleString()} />
                <Stat label="Avg monthly pool per entry" value={currency(model.leaguePrizeBudget / Math.max(1, model.activePaidEntries))} />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)]">
          <div className="border-b border-[var(--color-card-border)] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Projected paid league pools</p>
            <p className="mt-1 text-sm text-[var(--color-card-muted)]">
              Pools are weighted by demand share, months open, and boost. This keeps total league prizes capped at {leaguePrizePercent}% of revenue.
            </p>
          </div>
          <div className="hidden grid-cols-[1.3fr_70px_90px_90px_110px_110px_110px] gap-3 px-5 py-3 text-[10px] font-black uppercase tracking-wider text-[var(--color-card-muted)] md:grid">
            <span>League</span>
            <span>Sport</span>
            <span className="text-right">Demand</span>
            <span className="text-right">Entries</span>
            <span className="text-right">Monthly pool</span>
            <span className="text-right">Season pool</span>
            <span className="text-right">Pool / entry</span>
          </div>
          <div className="divide-y divide-[var(--color-card-border)]">
            {model.leagues.map((league) => (
              <div key={league.name} className="grid gap-2 px-5 py-4 md:grid-cols-[1.3fr_70px_90px_90px_110px_110px_110px] md:items-center md:gap-3">
                <div>
                  <p className="text-sm font-black text-[var(--color-card-text)]">{league.name}</p>
                  <p className="mt-1 text-[10px] text-[var(--color-card-muted)]">{league.monthsOpen} months open / {league.boost.toFixed(2)}x boost</p>
                </div>
                <span className="text-xs font-bold text-[var(--color-card-muted)]">{league.sport}</span>
                <Metric label="Demand" value={percent(league.demandShare)} />
                <Metric label="Entries" value={Math.round(league.activeEntries).toLocaleString()} />
                <Metric label="Monthly" value={currency(league.monthlyPool)} />
                <Metric label="Season" value={currency(league.seasonPool)} />
                <Metric label="Per entry" value={currency(league.poolPerActiveEntry)} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function NumberInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max?: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-card-muted)]">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
        className="h-11 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] px-3 text-sm font-black text-[var(--color-card-text)] outline-none focus:border-[var(--color-brand-primary)]"
      />
    </label>
  );
}

function Stat({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "good" | "bad" }) {
  const color = tone === "good" ? "text-[var(--color-card-yes)]" : tone === "bad" ? "text-[var(--color-card-no)]" : "text-[var(--color-card-text)]";
  return (
    <div className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3">
      <p className={`text-lg font-black ${color}`}>{value}</p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-wider text-[var(--color-card-muted)]">{label}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 md:block md:text-right">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-card-muted)] md:hidden">{label}</span>
      <span className="text-xs font-black text-[var(--color-card-text)]">{value}</span>
    </div>
  );
}
