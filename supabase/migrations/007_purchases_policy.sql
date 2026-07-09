-- purchases existiert bereits seit dem Basis-Schema (Phase-2-Vorbereitung),
-- hatte aber noch keine RLS-Policy. Einträge werden ausschliesslich vom
-- Stripe-Webhook per Service-Role-Key geschrieben (umgeht RLS) – hier nur
-- Lesezugriff fürs Studio. Im Supabase SQL Editor ausführen.

create policy "Authenticated users read purchases"
  on purchases for select
  using (auth.role() = 'authenticated');
