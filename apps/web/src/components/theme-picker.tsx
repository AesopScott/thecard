"use client";

import { THEME_LABELS, THEMES, type AppTheme } from "@/lib/theme-store";
import { useTheme } from "@/contexts/theme-context";

const SWATCHES: Record<AppTheme, string> = {
  default: "linear-gradient(135deg, #ff3c3c 0 38%, #111118 38% 100%)",
  ticket: "linear-gradient(135deg, #ff3c3c 0 38%, #f5ead3 38% 100%)",
  ice: "linear-gradient(135deg, #ff3c3c 0 38%, #eef6ff 38% 100%)",
  mint: "linear-gradient(135deg, #ff3c3c 0 38%, #e8f7ee 38% 100%)",
  ink: "linear-gradient(135deg, #ff3c3c 0 38%, #171821 38% 100%)",
  neon: "linear-gradient(135deg, #ff3c3c 0 30%, #00f5d4 30% 65%, #7c3aed 65% 100%)",
  royal: "linear-gradient(135deg, #ff3c3c 0 34%, #2e1065 34% 68%, #facc15 68% 100%)",
  sunset: "linear-gradient(135deg, #ff3c3c 0 34%, #fb923c 34% 68%, #312e81 68% 100%)",
  candy: "linear-gradient(135deg, #ff3c3c 0 34%, #f9a8d4 34% 68%, #67e8f9 68% 100%)",
  terminal: "linear-gradient(135deg, #ff3c3c 0 34%, #052e16 34% 68%, #22c55e 68% 100%)",
};

export function ThemePicker({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme, syncStatus } = useTheme();

  return (
    <div className={compact ? "px-3 py-2" : "rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4"}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Theme</p>
        <span className="text-[10px] font-bold uppercase text-[var(--color-card-muted)]">{syncStatus}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {THEMES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => void setTheme(item)}
            className={`flex items-center gap-2 rounded-lg border px-2 py-2 text-left text-[11px] font-black transition-colors ${
              theme === item
                ? "border-[var(--color-brand-primary)] text-[var(--color-card-text)]"
                : "border-[var(--color-card-border)] text-[var(--color-card-muted)] hover:text-[var(--color-card-text)]"
            }`}
          >
            <span className="h-5 w-5 shrink-0 rounded-full border border-[var(--color-card-border)]" style={{ background: SWATCHES[item] }} />
            <span className="truncate">{THEME_LABELS[item]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
