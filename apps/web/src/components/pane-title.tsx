"use client";

import type { ReactNode } from "react";

interface PaneTitleProps {
  children: ReactNode;
  en: string;
  es: string;
  className?: string;
}

const defaultClassName = "text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]";

export function PaneTitle({ children, en, es, className = defaultClassName }: PaneTitleProps) {
  const nativeTitle = `EN: ${en}\nES: ${es}`;

  return (
    <span className="group relative inline-flex items-center gap-2 align-middle">
      <span className={className}>{children}</span>
      <button
        type="button"
        aria-label="Show pane explanation"
        title={nativeTitle}
        data-pane-title-help
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-[var(--color-card-border)] bg-[var(--color-surface-2)] text-[10px] font-black leading-none text-[var(--color-text-muted)] transition hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/50"
      >
        ?
      </button>
      <span className="pointer-events-none absolute left-0 top-full z-50 mt-2 hidden w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-3 text-left shadow-xl shadow-black/30 group-hover:block group-focus-within:block">
        <span className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">EN</span>
        <span className="mt-1 block text-xs leading-relaxed text-[var(--color-card-text)]">{en}</span>
        <span className="mt-3 block text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">ES</span>
        <span className="mt-1 block text-xs leading-relaxed text-[var(--color-card-text)]">{es}</span>
      </span>
    </span>
  );
}
