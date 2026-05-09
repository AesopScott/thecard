"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const NAV_ITEMS = [
  { href: "/card", label: "Card", icon: "♠" },
  { href: "/live", label: "Live", icon: "⚡" },
  { href: "/learn", label: "Learn", icon: "◎" },
  { href: "/picks", label: "Picks", icon: "✦" },
  { href: "/leaderboard", label: "Board", icon: "▲" },
] as const;

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-card-border)] bg-[var(--color-card-surface)]">
      <ul className="flex items-center justify-around px-2 py-3 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={clsx(
                  "flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                  isActive
                    ? "text-[var(--color-card-accent)]"
                    : "text-[var(--color-card-muted)] hover:text-[var(--color-card-text)]"
                )}
              >
                <span className="text-lg leading-none">{icon}</span>
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
