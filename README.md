# SendaLore

_Geschichten, die deinen Weg begleiten. / Stories that walk with you._

Audioguide-Publishing-Plattform: Erstellen, Hosten und Verkaufen von
GPS-gestützten Audiotouren. Siehe `PRD.md` für den vollständigen Produkt-Scope
und `TODO.md` für die laufende Roadmap.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- shadcn/ui-Komponenten (`src/components/ui`), Framer Motion, lucide-react
- Supabase (Postgres, Auth, Storage) — Client-Setup in `src/lib/supabase`
- Leaflet für Karten (`src/components/tour-map.tsx`); Kartenkacheln optional über
  Thunderforest (alpiner Stil, sonst Standard-OSM), Fussweg-Routing optional über
  OpenRouteService (sonst Luftlinie) – siehe `src/lib/map-tiles.ts` / `src/lib/routing`
- DeepL + ElevenLabs für die KI-gestützte Übersetzungs-/Vertonungs-Pipeline im Studio
- Stripe (REST-API, kein SDK) für den Einzelkauf kostenpflichtiger Touren
- PWA (Manifest, Service Worker) mit Offline-Speicherung pro Tour über die Cache API

## Lokale Entwicklung

```bash
npm install
cp .env.example .env.local   # Supabase-URL/Anon-Key eintragen
npm run dev
```

Ohne gesetzte Supabase-Umgebungsvariablen läuft die App weiter (öffentliche
Seiten zeigen einen Hinweis, `/studio` ist ohne Login nicht nutzbar).

Das Datenbankschema liegt in `supabase/schema.sql`, einzelne Migrationsschritte
in `supabase/migrations/` (der Reihe nach im Supabase SQL Editor ausführen).

## Projektstruktur

- `src/app/(site)` — öffentliche Seiten (Katalog, Tour-Detail), mehrsprachige
  Oberfläche (DE/EN) über `src/lib/i18n`
- `src/app/studio` — geschützter Admin-Bereich (Login, Tour-/Stationen-CRUD,
  Übersetzungen, KI-Pipeline, Excel-Import) — bleibt auf Deutsch
- `src/lib/supabase` — Browser-/Server-/Proxy-Clients
- `src/lib/tours.ts` — geteilte Typen (Tour, Station) und Content-Übersetzungen
- `src/lib/i18n` — UI-Sprachwörterbücher (Oberflächentexte, nicht Tour-Inhalte)

## Status

MVP + Phase-2-Funktionen (Katalog-Filter, Bewertungen/Statistik, Quiz für
Kinder-/Schul-Touren, Offline/PWA, Stripe-Einzelkauf) sind umgesetzt. Siehe
`TODO.md` für den einzigen offenen Punkt (finale ElevenLabs-Stimmnamen).
