import { cpSync, existsSync, rmSync } from "fs";
import { join } from "path";

const routes = ["", "card", "live", "blitz", "h2h", "forecast", "leaderboard", "leagues", "perfect-ten", "sports-calendar"];

for (const route of routes) {
  const src = join("out", route, "opengraph-image");
  const dest = join("out", route, "og.png");
  if (existsSync(src)) {
    cpSync(src, dest);
    console.log(`copied ${src} -> ${dest}`);
  }
}

if (existsSync("out")) {
  rmSync(".next-build", { recursive: true, force: true });
  cpSync("out", ".next-build", { recursive: true });
  console.log("mirrored out -> .next-build");
}
