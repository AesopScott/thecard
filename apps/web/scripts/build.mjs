import { spawnSync } from "node:child_process";

const result = spawnSync("next", ["build"], {
  env: { ...process.env, NEXT_DIST_DIR: ".next-build" },
  shell: process.platform === "win32",
  stdio: "inherit",
});

process.exit(result.status ?? 1);
