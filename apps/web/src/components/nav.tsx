"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const NAV_ITEMS = [
  { href: "/card", label: "Card", emoji: "🎴" },
  { href: "/live", label: "Live", emoji: "⚡" },
  { href: "/learn", label: "Learn", emoji: "📚" },
  { href: "/picks", label: "Picks", emoji: "🎯" },
  { href: "/leaderboard", label: "Board", emoji: "🏆" },
] as const;

export function Nav() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-card-border)] bg-[var(--color-card-surface)] backdrop-blur-sm">
      <ul className="flex items-center justify-around px-2 py-3 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, label, emoji }) => {
          const isActive = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={clsx(
                  "flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs font-bold transition-all duration-200",
                  isActive
                    ? "text-[var(--color-brand-primary)] bg-[var(--color-surface-2)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]"
                )}
              >
                <span className="text-xl leading-none">{emoji}</span>
                <span className="tracking-tight">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
