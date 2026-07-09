# SendaLore – Roadmap / To-Do

Stand: siehe Git-Historie des Branches `claude/digititeacher-repo-setup-eggh3v`.
Diese Liste dient als Grundlage für spätere `to-do-all`-Durchläufe.

## Namenswechsel

Projekt heisst neu **SendaLore**.
Claim DE: „Geschichten, die deinen Weg begleiten"
Claim EN: „Stories that walk with you"

## ✅ Bereits umgesetzt

- Next.js-Grundgerüst (App Router, TS, Tailwind v4), shadcn/ui-Basis, Framer Motion, Leaflet
- Supabase: Auth, DB-Schema (tours, stations, purchases), Storage
- Studio: Login, Touren-/Stationen-CRUD, editierbare Stationen, Audio-Upload
- Öffentlicher Katalog mit Erlebnis-Genres (Wissen, Kinder, Romantik, Sagen, Schule) + Badges
- Twilight-Ridge-Design: Farbpalette (Pergament/Petrol/Gold + Mist/Dusk/Twilight-Akzente),
  Fraunces-Serifen-Typografie, mehrschichtiges Parallax-Hero (SVG-Bergketten, Nebel, Sonne
  mit dezentem Atmen + Hover-Verstärkung)
- Online-Player: GPS-Autoplay mit konfigurierbarem Toleranzradius, manuelles Play/Pause,
  ±15-Sekunden-Sprung, aufklappbares Transkript, Hörfortschritt (localStorage), Wake Lock
- Tour-/Stationen-Übersetzungen (DB-Modell) + Sprachumschalter auf der Tourseite (DE Basis, EN/IT/FR/RM)
- Website-UI zweisprachig (DE/EN) über eigenes `lib/i18n`-Wörterbuch, getrennt vom Touren-Übersetzungssystem
- KI-Pipeline im Studio: DeepL-Übersetzung, ElevenLabs-Audioerzeugung pro Genre-Stimme
- Excel-Import für Touren (Vorlage-Download, Vorschau, toleranter Spalten-Parser)
- Fotos/Videos pro Station mit Medien-Karussell (nur sichtbar wenn Medien vorhanden)
- Coverbild-Direkt-Upload im Studio (Supabase Storage, `media`-Bucket)
- Katalog: Suche, Filter (Genre/Region/Schwierigkeit), Listen-/Kartenansicht aller Touren
- Bewertungen (1–5 Sterne + Kommentar) pro Tour, Aufruf-Zähler, Studio-Statistik pro Tour
  (Aufrufe, Ø-Bewertung, Kommentarliste mit Lösch-Option)
- Quiz/Gamification für Kinder-/Schul-Touren: Frage pro Station im Studio, Punkte-Tracking
  im Player (localStorage)
- PWA: Manifest, App-Icons (code-generiert via `next/og`), Service Worker; „Für offline
  speichern"-Button pro Tour cached Cover/Audio/Bilder per Cache API
- Stripe-Einzelkauf: Preisfeld im Studio, Checkout-Session per REST-API (kein SDK), Webhook
  schreibt `purchases`, einfache Browser-Freischaltung (kein volles Login-System) für den Player
- Hover-Effekte: Tour-Kacheln (Lift + Glow + Sheen), Nav-Links (Unterstrich)
- Migrationen 001–007 (genre, station-media/transcript/radius, translations, station_media,
  tour_feedback/tour_views, station_quiz, purchases-Policy)

## 🔲 Offen / geplant

- **ElevenLabs-Stimmen final eintragen** – Platzhalter-Stimmen pro Genre ersetzen durch
  die in der Masterarbeit vorgeschlagenen. Blockiert: Anhang mit den Stimmnamen lag im
  Upload nicht vollständig vor (Masterarbeit endete vor den relevanten Seiten). Sobald
  Matt die Stimmnamen/Voice-IDs nachreicht, in `src/lib/ai/voices.ts` eintragen (oder als
  `ELEVENLABS_VOICE_<GENRE>`-Env-Var setzen, ohne Code-Änderung).

## Offene Fragen an Matt

- ElevenLabs-Stimmnamen aus dem Masterarbeit-Anhang nachreichen
- Ziel-Excel-Format (Spaltennamen) für Import abgleichen, falls abweichend von der Vorlage
- Stripe/Supabase-Service-Role-Keys in Vercel eintragen, sobald echte Zahlungen live gehen sollen
