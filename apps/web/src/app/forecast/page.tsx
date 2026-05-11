import { ForecastClient } from "./forecast-client";

export const metadata = {
  title: "Forecast - The Card",
  openGraph: { images: [{ url: "/forecast/og.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image" as const, images: ["/forecast/og.png"] },
};

export default function ForecastPage() {
  return <ForecastClient />;
}
