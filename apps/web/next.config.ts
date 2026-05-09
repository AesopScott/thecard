import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: [
    "@thecard/types",
    "@thecard/exchange-client",
    "@thecard/scoring",
  ],
};

export default config;
