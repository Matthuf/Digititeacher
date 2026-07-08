-- Fotos und Videos pro Station (für das Medien-Karussell).
-- Im Supabase SQL Editor ausführen.

create table if not exists station_media (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references stations (id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  url text not null,
  caption text,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists station_media_station_idx
  on station_media (station_id);

alter table station_media enable row level security;

create policy "Media of published tours are readable"
  on station_media for select
  using (
    exists (
      select 1 from stations
      join tours on tours.id = stations.tour_id
      where stations.id = station_media.station_id
      and tours.status = 'published'
    )
  );

create policy "Authenticated users manage station media"
  on station_media for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Öffentlicher Medien-Bucket (Bilder/Videos).
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "Authenticated can upload media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media');

create policy "Authenticated can update media"
  on storage.objects for update to authenticated
  using (bucket_id = 'media');

create policy "Authenticated can delete media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media');
