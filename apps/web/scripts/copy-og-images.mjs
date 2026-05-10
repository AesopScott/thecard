import { cpSync, existsSync } from "fs";
import { join } from "path";

const routes = ["", "card", "live", "blitz", "h2h", "forecast", "leaderboard", "learn", "leagues", "perfect-ten"];

for (const route of routes) {
  const src = join("out", route, "opengraph-image");
  const dest = join("out", route, "og.png");
  if (existsSync(src)) {
    cpSync(src, dest);
    console.log(`copied ${src} → ${dest}`);
  }
}
