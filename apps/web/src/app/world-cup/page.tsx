import type { Metadata } from "next";
import { WorldCupCampaignClient } from "./world-cup-campaign-client";

export const metadata: Metadata = {
  title: "World Cup Free Challenge - The Card",
  description: "Play The Card's free World Cup campaign from June 11 to July 19, 2026.",
};

export default function WorldCupCampaignPage() {
  return <WorldCupCampaignClient />;
}
