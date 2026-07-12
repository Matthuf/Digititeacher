import { createServiceClient } from "@/lib/supabase/service";

// Kaufprüfung per Service-Role-Client (umgeht RLS, nur serverseitig). Bewusst
// KEINE neue öffentliche RLS-Policy auf `purchases`, damit die Tabelle nicht
// anonym lesbar/enumerierbar wird. Der E-Mail-Vergleich ist case-insensitiv.
export async function hasPurchase(
  tourId: string,
  email: string,
): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;

  const supabase = createServiceClient();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("purchases")
    .select("email")
    .eq("tour_id", tourId);

  if (error || !data) return false;
  // Vergleich in JS statt ilike, damit E-Mails mit "_"/"%" nicht als
  // Wildcard interpretiert werden.
  return data.some((row) => row.email?.trim().toLowerCase() === normalized);
}
