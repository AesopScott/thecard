"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProfileClient } from "./[username]/profile-client";
import { ThemePicker } from "@/components/theme-picker";
import { useI18n } from "@/contexts/i18n-context";

export function ProfileQueryClient() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const username = (searchParams?.get("u") ?? searchParams?.get("username") ?? "").trim().toLowerCase();

  if (!username) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-10 text-center">
        <h1 className="text-2xl font-black text-[var(--color-card-text)]">{t("profile.findProfile")}</h1>
        <p className="text-sm text-[var(--color-card-muted)]">
          {t("profile.findProfileBody")}
        </p>
        <Link href="/leaderboard" className="mx-auto rounded-lg border border-[var(--color-card-border)] px-4 py-2 text-xs font-bold text-[var(--color-card-text)]">
          {t("profile.goLeaderboard")}
        </Link>
        <ThemePicker />
      </div>
    );
  }

  return <ProfileClient username={username} />;
}
