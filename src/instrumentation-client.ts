import * as Sentry from "@sentry/nextjs";

// Client-seitiges Fehler-Monitoring (ersetzt sentry.client.config.ts in
// aktuellen SDK-Versionen). Ohne NEXT_PUBLIC_SENTRY_DSN inaktiv.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}

// Router-Navigationen als Transaktionen erfassen (No-op ohne Init).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
