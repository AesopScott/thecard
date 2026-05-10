"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUserProfileByUsername, type UserProfile } from "@/lib/user-store";

interface ProfileClientProps {
  username: string;
}

export function ProfileClient({ username }: ProfileClientProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getUserProfileByUsername(username)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
        <div className="h-24 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)]" />
        <div className="h-28 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-10 text-center">
        <h1 className="text-2xl font-black text-[var(--color-card-text)]">Profile not found</h1>
        <p className="text-sm text-[var(--color-card-muted)]">@{username.toLowerCase()} is not claimed yet.</p>
        <Link href="/leaderboard" className="mx-auto rounded-lg border border-[var(--color-card-border)] px-4 py-2 text-xs font-bold text-[var(--color-card-text)]">
          Back to leaderboard
        </Link>
      </div>
    );
  }

  const score = Math.round(profile.calibrationScore);
  const avgBrier = profile.avgBrierScore === null ? "-" : profile.avgBrierScore.toFixed(3);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-6">
      <header className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-card-accent)] text-xl font-black text-white">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
            ) : (
              profile.username[0]?.toUpperCase() ?? "?"
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-black text-[var(--color-card-text)]">@{profile.username}</h1>
              {profile.emailVerified && (
                <span className="rounded-full border border-[var(--color-brand-primary)]/30 px-2 py-0.5 text-[10px] font-bold text-[var(--color-brand-primary)]">
                  Verified
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-[var(--color-card-muted)]">
              {profile.teamName ? `${profile.teamName} forecaster` : "Independent forecaster"}
            </p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-3">
        {[
          { label: "Calibration", value: profile.resolvedCount >= 5 ? String(score) : "-" },
          { label: "Brier", value: avgBrier },
          { label: "Resolved", value: String(profile.resolvedCount) },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-3 text-center"
          >
            <p className="text-xl font-black text-[var(--color-card-text)]">{value}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--color-card-muted)]">{label}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
        <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Track record</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-card-muted)]">
          Public prediction history and settled positions will appear here once market settlement is wired into the live product.
        </p>
      </section>
    </div>
  );
}
