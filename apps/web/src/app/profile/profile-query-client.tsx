"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProfileClient } from "./[username]/profile-client";

export function ProfileQueryClient() {
  const searchParams = useSearchParams();
  const username = (searchParams.get("u") ?? searchParams.get("username") ?? "").trim().toLowerCase();

  if (!username) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-10 text-center">
        <h1 className="text-2xl font-black text-[var(--color-card-text)]">Find a profile</h1>
        <p className="text-sm text-[var(--color-card-muted)]">
          Choose a forecaster from the leaderboard to view their public track record.
        </p>
        <Link href="/leaderboard" className="mx-auto rounded-lg border border-[var(--color-card-border)] px-4 py-2 text-xs font-bold text-[var(--color-card-text)]">
          Go to leaderboard
        </Link>
      </div>
    );
  }

  return <ProfileClient username={username} />;
}
