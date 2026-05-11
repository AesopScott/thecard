import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Card",
    short_name: "The Card",
    description: "Sports prediction markets for fans, not traders.",
    start_url: "/card/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a0f",
    theme_color: "#0a0a0f",
    categories: ["sports", "games", "finance"],
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "any" },
      { src: "/web-app-icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/web-app-icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
