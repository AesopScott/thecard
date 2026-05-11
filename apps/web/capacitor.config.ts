import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "bet.thecard.app",
  appName: "The Card",
  webDir: ".next-build",
  server: {
    androidScheme: "https",
    iosScheme: "thecard",
  },
  ios: {
    contentInset: "automatic",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
