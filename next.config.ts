import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    // Cover-Bilder kommen aus Supabase Storage oder beliebigen vom Admin
    // eingetragenen HTTPS-URLs.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

// Sentry-Build-Plugin. Der Source-Map-Upload braucht org/project + einen
// SENTRY_AUTH_TOKEN; fehlen diese, wird der Upload übersprungen und der Build
// läuft trotzdem durch (Sentry selbst startet nur mit gesetztem DSN). So bleibt
// die Integration vollständig optional, wie alle anderen im Projekt.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
  // Kein automatisches Aufsetzen von Tunnel-Routes o. Ä.
  telemetry: false,
});
