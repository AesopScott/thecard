import { Suspense } from "react";
import { ProfileQueryClient } from "./profile-query-client";

export const metadata = { title: "Profile - The Card" };

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-lg px-4 py-10 text-sm text-[var(--color-card-muted)]">Loading profile...</div>}>
      <ProfileQueryClient />
    </Suspense>
  );
}
