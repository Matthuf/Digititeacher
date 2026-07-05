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
