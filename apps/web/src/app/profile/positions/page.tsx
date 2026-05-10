import { Suspense } from "react";
import { ProfilePositionsClient } from "./positions-client";

export const metadata = { title: "Position History - The Card" };

export default function ProfilePositionsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-lg px-4 py-10 text-sm text-[var(--color-card-muted)]">Loading positions...</div>}>
      <ProfilePositionsClient />
    </Suspense>
  );
}
