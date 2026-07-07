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
