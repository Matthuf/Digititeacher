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
