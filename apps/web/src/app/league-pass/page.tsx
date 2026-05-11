import Link from "next/link";

const FREE_FEATURES = [
  "2 free league slots",
  "1 friends league",
  "Global board included",
  "Free league shadow bankrolls",
];

const PASS_FEATURES = [
  "5 free league slots",
  "3 friends leagues",
  "3 prize-eligible paid league slots",
  "Global rank perks as they unlock",
];

const PRIZE_NOTES = [
  "Paid leagues are prize-eligible competitions with their own bankroll and leaderboard.",
  "Free leagues still count toward Global stats, but they do not create prize payouts.",
  "Every settled bet keeps its league label so profiles can show paid, free, and friend results separately.",
];

export const metadata = { title: "League Pass - The Card" };

export default function LeaguePassPage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] px-4 pb-32 pt-8 text-[var(--color-text-primary)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <Link href="/leagues" className="text-sm font-bold text-[var(--color-brand-primary)] hover:underline">
          Back to leagues
        </Link>

        <header className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">League Pass</p>
          <h1 className="mt-2 font-display text-4xl font-black text-[var(--color-card-text)]">More leagues. More prize shots.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-card-muted)]">
            League Pass is the paid account layer for players who want more league slots, prize-eligible boards, and a deeper profile record across The Card.
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-2">
          <PlanCard
            eyebrow="Free"
            title="Start with free leagues"
            price="$0"
            detail="Enough to play with friends, test the board, and build a Global record."
            features={FREE_FEATURES}
            cta="Included"
            muted
          />
          <PlanCard
            eyebrow="League Pass"
            title="Unlock paid league access"
            price="$10/mo"
            detail="Built for players who want prize-eligible leagues and more active boards at once."
            features={PASS_FEATURES}
            cta="Checkout coming soon"
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Prize-eligible leagues</p>
            <h2 className="mt-2 text-2xl font-black text-[var(--color-card-text)]">What you are buying</h2>
            <div className="mt-4 grid gap-3">
              {PRIZE_NOTES.map((note) => (
                <div key={note} className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3">
                  <p className="text-sm leading-relaxed text-[var(--color-card-muted)]">{note}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Extra slots</p>
            <p className="mt-2 text-3xl font-black text-[var(--color-card-text)]">$2/mo</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-card-muted)]">
              Each extra slot adds one paid league slot and two more free league slots.
            </p>
            <button
              type="button"
              disabled
              className="mt-4 w-full rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] px-4 py-3 text-sm font-black text-[var(--color-card-muted)]"
            >
              Add-ons coming soon
            </button>
          </aside>
        </section>

        <section className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Global board</p>
          <h2 className="mt-2 text-2xl font-black text-[var(--color-card-text)]">Every settled bet still matters.</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--color-card-muted)]">
            Global does not use a league slot. It is the all-time record layer across free, friends, paid, and live play. As the board matures, top players can earn profile benefits, status, and special league access.
          </p>
        </section>

        <section className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Prize model</p>
          <h2 className="mt-2 text-2xl font-black text-[var(--color-card-text)]">Run the numbers before we promise them.</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--color-card-muted)]">
            The current planning model sends 60% of revenue to paid league prize pools, 10% to Pick 10, and 30% through to the platform.
          </p>
          <Link href="/prize-math" className="mt-4 inline-flex rounded-xl border border-[var(--color-card-border)] px-4 py-3 text-sm font-black text-[var(--color-card-text)] hover:border-[var(--color-brand-primary)]">
            Open prize math simulator
          </Link>
        </section>
      </div>
    </div>
  );
}

function PlanCard({
  eyebrow,
  title,
  price,
  detail,
  features,
  cta,
  muted = false,
}: {
  eyebrow: string;
  title: string;
  price: string;
  detail: string;
  features: string[];
  cta: string;
  muted?: boolean;
}) {
  return (
    <article className={`rounded-xl border p-5 ${muted ? "border-[var(--color-card-border)] bg-[var(--color-card-surface)]" : "border-[var(--color-brand-primary)]/40 bg-[var(--color-card-surface)]"}`}>
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">{eyebrow}</p>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[var(--color-card-text)]">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-card-muted)]">{detail}</p>
        </div>
        <p className="shrink-0 text-2xl font-black text-[var(--color-card-text)]">{price}</p>
      </div>
      <div className="mt-4 grid gap-2">
        {features.map((feature) => (
          <div key={feature} className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] px-3 py-2">
            <p className="text-sm font-bold text-[var(--color-card-text)]">{feature}</p>
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled
        className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-black ${muted ? "border border-[var(--color-card-border)] text-[var(--color-card-muted)]" : "bg-[var(--color-brand-primary)] text-white opacity-80"}`}
      >
        {cta}
      </button>
    </article>
  );
}
