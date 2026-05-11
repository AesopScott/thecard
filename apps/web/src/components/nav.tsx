"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useI18n } from "@/contexts/i18n-context";
import type { TranslationKey } from "@/lib/i18n";
import pkg from "../../package.json";

const NAV_ITEMS: { href: string; labelKey: TranslationKey; icon: string }[] = [
  { href: "/card", labelKey: "nav.card", icon: "C" },
  { href: "/live", labelKey: "nav.live", icon: "L" },
  { href: "/blitz", labelKey: "nav.blitz", icon: "B" },
  { href: "/h2h", labelKey: "nav.h2h", icon: "H" },
  { href: "/forecast", labelKey: "nav.forecast", icon: "F" },
  { href: "/perfect-ten", labelKey: "nav.perfectTen", icon: "10" },
  { href: "/leagues", labelKey: "nav.leagues", icon: "LG" },
  { href: "/sports-calendar", labelKey: "nav.calendar", icon: "CAL" },
  { href: "/league-pass", labelKey: "nav.leaguePass", icon: "LP" },
  { href: "/leaderboard", labelKey: "nav.board", icon: "#" },
];

export function Nav() {
  const pathname = usePathname() ?? "/";
  const { t } = useI18n();

  if (pathname === "/") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-card-border)] bg-[var(--color-card-surface)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <ul className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 pb-1 pt-2">
        {NAV_ITEMS.map(({ href, labelKey, icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <li key={href} className="min-w-0">
              <Link
                href={href}
                className={clsx(
                  "flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 transition-all duration-200",
                  isActive
                    ? "bg-[var(--color-surface-2)] text-[var(--color-brand-primary)]"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
                )}
              >
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full border border-current px-1 text-[9px] font-black leading-none">{icon}</span>
                <span className="max-w-full truncate text-[10px] font-bold tracking-tight">{t(labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="pb-1 text-center text-[9px] tracking-wider text-[var(--color-text-muted)] opacity-40">
        v{pkg.version}
      </p>
    </nav>
  );
}
