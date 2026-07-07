-- Stationen: Transkript + individueller GPS-Toleranzradius,
-- plus Storage-Bucket für Audio-Uploads aus dem Studio.
-- Im Supabase SQL Editor ausführen.

alter table stations
  add column if not exists transcript text,
  add column if not exists trigger_radius_m integer
    check (trigger_radius_m is null or trigger_radius_m between 5 and 500);

-- Öffentlicher Audio-Bucket (Lesen für alle über die Public URL,
-- Schreiben nur für den eingeloggten Admin).
insert into storage.buckets (id, name, public)
values ('audio', 'audio', true)
on conflict (id) do nothing;

create policy "Authenticated can upload audio"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'audio');

create policy "Authenticated can update audio"
  on storage.objects for update to authenticated
  using (bucket_id = 'audio');

create policy "Authenticated can delete audio"
  on storage.objects for delete to authenticated
  using (bucket_id = 'audio');
