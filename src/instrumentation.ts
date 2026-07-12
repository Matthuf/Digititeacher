import * as Sentry from "@sentry/nextjs";

// Lädt die passende Sentry-Server-/Edge-Konfiguration je nach Runtime. Die
// Konfigurationen initialisieren Sentry nur, wenn SENTRY_DSN gesetzt ist.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Serverseitige Request-Fehler an Sentry melden (No-op ohne Init).
export const onRequestError = Sentry.captureRequestError;
