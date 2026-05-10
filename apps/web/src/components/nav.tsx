"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import pkg from "../../package.json";

const NAV_ITEMS = [
  { href: "/card",            label: "Card",     emoji: "🎴" },
  { href: "/live",            label: "Live",     emoji: "⚡" },
  { href: "/blitz",           label: "Blitz",    emoji: "🔥" },
  { href: "/h2h",             label: "H2H",      emoji: "🥊" },
  { href: "/forecast",        label: "Forecast", emoji: "🎯" },
  { href: "/perfect-ten",     label: "P10",      emoji: "💰" },
  { href: "/leagues",         label: "Leagues",  emoji: "🏟️" },
  { href: "/sports-calendar", label: "Calendar", emoji: "📅" },
  { href: "/picks",           label: "Picks",    emoji: "🤖" },
  { href: "/leaderboard",     label: "Board",    emoji: "🏆" },
] as const;

export function Nav() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-card-border)] bg-[var(--color-card-surface)] backdrop-blur-sm">
      <ul className="grid grid-cols-5 gap-1 px-2 pt-2 pb-1 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, label, emoji }) => {
          const isActive = pathname.startsWith(href);
          return (
            <li key={href} className="min-w-0">
              <Link
                href={href}
                className={clsx(
                  "flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 transition-all duration-200",
                  isActive
                    ? "text-[var(--color-brand-primary)] bg-[var(--color-surface-2)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]"
                )}
              >
                <span className="text-lg leading-none">{emoji}</span>
                <span className="max-w-full truncate text-[10px] font-bold tracking-tight">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="text-center text-[9px] text-[var(--color-text-muted)] opacity-40 pb-1 tracking-wider">
        v{pkg.version}
      </p>
    </nav>
  );
}
