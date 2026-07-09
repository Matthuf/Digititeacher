import { createClient } from "@supabase/supabase-js";

/**
 * Service-Role-Client für serverseitige Vorgänge ohne Nutzer-Session (z. B.
 * Stripe-Webhook). Umgeht RLS komplett – niemals an den Client geben und
 * SUPABASE_SERVICE_ROLE_KEY nur serverseitig setzen.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
