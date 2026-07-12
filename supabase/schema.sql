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

-- === Aus Migration 005 ===
-- Bewertungen/Kommentare pro Tour + einfacher View-Zähler für die
-- Studio-Statistik. Im Supabase SQL Editor ausführen.

create table if not exists tour_feedback (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references tours (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists tour_feedback_tour_idx on tour_feedback (tour_id);

alter table tour_feedback enable row level security;

create policy "Anyone can submit feedback for published tours"
  on tour_feedback for insert
  with check (
    exists (
      select 1 from tours
      where tours.id = tour_feedback.tour_id
      and tours.status = 'published'
    )
  );

create policy "Feedback of published tours is publicly readable"
  on tour_feedback for select
  using (
    exists (
      select 1 from tours
      where tours.id = tour_feedback.tour_id
      and tours.status = 'published'
    )
  );

create policy "Authenticated users manage feedback"
  on tour_feedback for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create table if not exists tour_views (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references tours (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists tour_views_tour_idx on tour_views (tour_id);

alter table tour_views enable row level security;

create policy "Anyone can record a view for published tours"
  on tour_views for insert
  with check (
    exists (
      select 1 from tours
      where tours.id = tour_views.tour_id
      and tours.status = 'published'
    )
  );

create policy "Authenticated users read views"
  on tour_views for select
  using (auth.role() = 'authenticated');

-- === Aus Migration 006 ===
-- Quiz-Frage pro Station (Gamification für Kinder-/Schul-Touren).
-- Höchstens eine Frage pro Station, daher unique auf station_id.
-- Im Supabase SQL Editor ausführen.

create table if not exists station_quiz (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null unique references stations (id) on delete cascade,
  question text not null,
  options jsonb not null,
  correct_index integer not null check (correct_index >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists station_quiz_station_idx on station_quiz (station_id);

alter table station_quiz enable row level security;

create policy "Quiz of published tours are publicly readable"
  on station_quiz for select
  using (
    exists (
      select 1 from stations
      join tours on tours.id = stations.tour_id
      where stations.id = station_quiz.station_id
      and tours.status = 'published'
    )
  );

create policy "Authenticated users manage quiz"
  on station_quiz for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- === Aus Migration 007 ===
-- purchases existiert bereits seit dem Basis-Schema (Phase-2-Vorbereitung),
-- hatte aber noch keine RLS-Policy. Einträge werden ausschliesslich vom
-- Stripe-Webhook per Service-Role-Key geschrieben (umgeht RLS) – hier nur
-- Lesezugriff fürs Studio. Im Supabase SQL Editor ausführen.

create policy "Authenticated users read purchases"
  on purchases for select
  using (auth.role() = 'authenticated');

-- === Aus Migration 008 ===
-- Manuelles Highlight-Flag: im Studio pro Tour setzbar, steuert die
-- "Empfohlene Touren"-Karussell-Sektion auf der Startseite.
-- Im Supabase SQL Editor ausführen.

alter table tours add column if not exists is_featured boolean not null default false;

create index if not exists tours_featured_idx on tours (is_featured) where is_featured;

-- === Aus Migration 9 ===
-- Zusätzliche Tour-Detailfelder für die überarbeitete Tourdetailseite
-- (Distanz, Höhenmeter, Zielgruppen, Ausrüstung, Eignung, Anreise,
-- Barrierefreiheit, Hörprobe, FAQ). Alle Spalten sind nullable und werden
-- redaktionell im Studio gepflegt. Im Supabase SQL Editor ausführen.

alter table tours
  add column if not exists distance_km numeric,
  add column if not exists elevation_gain_m integer,
  add column if not exists elevation_loss_m integer,
  add column if not exists target_groups text[],
  add column if not exists equipment text[],
  add column if not exists suitability_tags text[],
  add column if not exists arrival_info text,
  add column if not exists accessibility_info text,
  add column if not exists audio_preview_url text,
  add column if not exists audio_preview_duration_seconds integer,
  add column if not exists faq jsonb;
