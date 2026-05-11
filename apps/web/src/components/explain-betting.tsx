"use client";

import { useState } from "react";

interface ExplainSection {
  title: string;
  body: string;
}

interface ExplainBettingProps {
  buttonLabel: string;
  title: string;
  summary: string;
  sections: ExplainSection[];
}

export function ExplainBetting({ buttonLabel, title, summary, sections }: ExplainBettingProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Need the rules?</p>
          <p className="mt-1 text-sm font-semibold text-[var(--color-card-text)]">{title}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] px-4 py-2 text-xs font-black uppercase text-[var(--color-card-text)] transition-colors hover:border-[var(--color-brand-primary)]/60"
        >
          {open ? "Hide explanation" : buttonLabel}
        </button>
      </div>

      {open && (
        <div className="mt-4 border-t border-[var(--color-card-border)] pt-4">
          <p className="max-w-3xl text-sm leading-relaxed text-[var(--color-card-muted)]">{summary}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {sections.map((section) => (
              <div key={section.title} className="rounded-lg bg-[var(--color-card-bg)] p-3">
                <p className="text-xs font-black uppercase tracking-wider text-[var(--color-brand-primary)]">{section.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-card-text)]">{section.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
