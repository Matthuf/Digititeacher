-- Zusätzliche Tour-Detailfelder für die überarbeitete Tourdetailseite
-- (Distanz, Höhenmeter, Zielgruppen, Ausrüstung, Eignung, Anreise,
-- Barrierefreiheit, Hörprobe, FAQ). Alle Spalten sind nullable und werden
-- redaktionell im Studio gepflegt – kein Backfill, keine Defaults nötig.
-- Basissprache (Deutsch); noch nicht Teil des Übersetzungssystems.
-- Im Supabase SQL Editor ausführen.

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
