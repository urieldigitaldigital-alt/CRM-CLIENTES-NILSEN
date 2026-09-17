import type { CapacitorConfig } from "@capacitor/cli";

// This wraps the live Next.js app in a native shell — the app is server-rendered
// (auth, Postgres, payment webhooks) so it can't be statically exported into www/.
// www/ only holds a placeholder shown for an instant before the WebView loads the
// real server URL below.
const config: CapacitorConfig = {
  appId: "com.operaciones.crm",
  appName: "Operaciones",
  webDir: "www",
  server: {
    url: "https://crm-agencia-indol.vercel.app",
    androidScheme: "https",
  },
  ios: {
    contentInset: "automatic",
  },
  android: {
    backgroundColor: "#0a0b12",
  },
};

export default config;
