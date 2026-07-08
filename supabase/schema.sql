-- Audioguide-Publishing-Plattform: Phase 1 (MVP) schema
-- Matches PRD section 6. Purchases table is included for Phase 2 forward-compat
-- but has no application code wired up yet in Phase 1.

create table if not exists tours (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  cover_image_url text,
  region text,
  duration_minutes integer,
  difficulty text,
  genre text check (genre in ('wissen', 'kinder', 'romantik', 'sagen', 'schule')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  price numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists stations (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references tours (id) on delete cascade,
  order_index integer not null,
  title text not null,
  description text,
  latitude double precision not null,
  longitude double precision not null,
  audio_url text,
  audio_duration_seconds integer,
  transcript text,
  trigger_radius_m integer
    check (trigger_radius_m is null or trigger_radius_m between 5 and 500),
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references tours (id) on delete cascade,
  email text not null,
  stripe_payment_id text,
  created_at timestamptz not null default now()
);

create index if not exists stations_tour_id_idx on stations (tour_id);
create index if not exists purchases_tour_id_idx on purchases (tour_id);

alter table tours enable row level security;
alter table stations enable row level security;
alter table purchases enable row level security;

-- Public (anon) can read published tours and their stations.
create policy "Published tours are publicly readable"
  on tours for select
  using (status = 'published');

create policy "Stations of published tours are publicly readable"
  on stations for select
  using (
    exists (
      select 1 from tours
      where tours.id = stations.tour_id
      and tours.status = 'published'
    )
  );

-- Authenticated admin (Matt, the only user in the MVP) has full access.
create policy "Authenticated users manage tours"
  on tours for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated users manage stations"
  on stations for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- === Aus Migration 003 ===
-- Übersetzungen (und später Erzählvarianten) pro Tour und Station.
-- Deutsch bleibt die Basis in tours/stations; hier liegen nur die
-- abweichenden Sprachfassungen. Alle Felder nullable: fehlende Felder
-- fallen im Frontend auf die deutsche Basis zurück.
-- Im Supabase SQL Editor ausführen.

create table if not exists tour_translations (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references tours (id) on delete cascade,
  locale text not null check (locale in ('en', 'it', 'fr', 'rm')),
  title text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tour_id, locale)
);

create table if not exists station_translations (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references stations (id) on delete cascade,
  locale text not null check (locale in ('en', 'it', 'fr', 'rm')),
  title text,
  description text,
  transcript text,
  audio_url text,
  audio_duration_seconds integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (station_id, locale)
);

create index if not exists tour_translations_tour_idx
  on tour_translations (tour_id);
create index if not exists station_translations_station_idx
  on station_translations (station_id);

alter table tour_translations enable row level security;
alter table station_translations enable row level security;

create policy "Translations of published tours are readable"
  on tour_translations for select
  using (
    exists (
      select 1 from tours
      where tours.id = tour_translations.tour_id
      and tours.status = 'published'
    )
  );

create policy "Station translations of published tours are readable"
  on station_translations for select
  using (
    exists (
      select 1 from stations
      join tours on tours.id = stations.tour_id
      where stations.id = station_translations.station_id
      and tours.status = 'published'
    )
  );

create policy "Authenticated users manage tour translations"
  on tour_translations for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated users manage station translations"
  on station_translations for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- === Aus Migration 004 ===
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
