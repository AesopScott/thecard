interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export function generateStaticParams() {
  return [{ username: "demo" }];
}

export const dynamicParams = false;

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">
      <header className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[var(--color-card-border)]" />
        <div>
          <h1 className="text-xl font-black text-[var(--color-card-text)]">
            @{username}
          </h1>
          <p className="text-sm text-[var(--color-card-muted)]">Forecaster</p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Calibration", value: "—" },
          { label: "Win Rate", value: "—" },
          { label: "Predictions", value: "0" },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-3 flex flex-col items-center gap-1"
          >
            <span className="text-xl font-black text-[var(--color-card-text)]">
              {value}
            </span>
            <span className="text-[10px] text-[var(--color-card-muted)] uppercase tracking-wider">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
