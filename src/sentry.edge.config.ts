import * as Sentry from "@sentry/nextjs";

// Edge-Runtime (Middleware, Edge-Routes). Ohne SENTRY_DSN inaktiv.
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}
