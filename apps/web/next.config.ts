import type { NextConfig } from "next";

const config: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  experimental: {
    cpus: 1,
  },
  transpilePackages: [
    "@thecard/types",
    "@thecard/exchange-client",
    "@thecard/scoring",
  ],
};

export default config;
