import { ProfileClient } from "./profile-client";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export function generateStaticParams() {
  return [{ username: "demo" }];
}

export const dynamicParams = false;

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  return <ProfileClient username={username} />;
}
