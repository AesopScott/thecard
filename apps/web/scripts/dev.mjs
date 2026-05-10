import { spawn } from "node:child_process";

const child = spawn("next", ["dev", "--port", "3000"], {
  env: { ...process.env, NEXT_DIST_DIR: ".next-dev" },
  shell: process.platform === "win32",
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
