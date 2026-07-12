import { headers } from "next/headers";

// Einfaches In-Memory-Sliding-Window-Limit für öffentliche Schreib-Aktionen.
// Bewusst nicht verteilt: Der Zähler lebt pro Serverless-Instanz und wird bei
// einem Cold Start zurückgesetzt. Für ein Solo-Projekt bei geringem Traffic
// reicht das, um trivialen Missbrauch (Feedback-Spam, unnötige Stripe-Calls)
// zu bremsen – kein Redis/Upstash-Overhead.

const hits = new Map<string, number[]>();

/** Client-IP aus den Proxy-Headern lesen (Vercel setzt x-forwarded-for). */
export async function clientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headerList.get("x-real-ip")?.trim() || "unknown";
}

/**
 * true = Anfrage erlaubt, false = Limit überschritten.
 * `bucket` trennt verschiedene Aktionen (z. B. "feedback" vs. "checkout").
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;
  const recent = (hits.get(key) ?? []).filter((t) => t > cutoff);

  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }

  recent.push(now);
  hits.set(key, recent);
  return true;
}
