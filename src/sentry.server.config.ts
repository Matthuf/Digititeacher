import * as Sentry from "@sentry/nextjs";

// Fehler-Monitoring, env-gated wie alle optionalen Integrationen. Ohne
// SENTRY_DSN wird Sentry NICHT initialisiert (kein Netzwerk, kein Overhead).
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    // Keine Personendaten (IP/Cookies) an Sentry senden.
    sendDefaultPii: false,
  });
}
