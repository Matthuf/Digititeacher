-- Erlebnis-Genre pro Tour (design-system/MASTER.md §2.2).
-- Im Supabase SQL Editor ausführen, bevor im Studio Genres gesetzt werden.

alter table tours
  add column if not exists genre text
  check (genre in ('wissen', 'kinder', 'romantik', 'sagen', 'schule'));
