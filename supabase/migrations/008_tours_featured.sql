-- Manuelles Highlight-Flag: im Studio pro Tour setzbar, steuert die
-- "Empfohlene Touren"-Karussell-Sektion auf der Startseite.
-- Im Supabase SQL Editor ausführen.

alter table tours add column if not exists is_featured boolean not null default false;

create index if not exists tours_featured_idx on tours (is_featured) where is_featured;
