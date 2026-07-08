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
