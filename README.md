# Digititeacher

Audioguide-Publishing-Plattform: Erstellen, Hosten und (später) Verkaufen von
GPS-gestützten Audiotouren. Siehe `PRD.md` für den vollständigen Produkt-Scope.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- shadcn/ui-Komponenten (`src/components/ui`), Framer Motion, lucide-react
- Supabase (Postgres, Auth, Storage) — Client-Setup in `src/lib/supabase`
- Leaflet/OpenStreetMap für Karten (`src/components/tour-map.tsx`)

## Lokale Entwicklung

```bash
npm install
cp .env.example .env.local   # Supabase-URL/Anon-Key eintragen
npm run dev
```

Ohne gesetzte Supabase-Umgebungsvariablen läuft die App weiter (öffentliche
Seiten zeigen einen Hinweis, `/studio` ist ohne Login nicht nutzbar).

Das Datenbankschema liegt in `supabase/schema.sql` (Tabellen `tours`,
`stations`, `purchases` inkl. Row Level Security).

## Projektstruktur

- `src/app/(site)` — öffentliche Seiten (Katalog, Tour-Detail)
- `src/app/studio` — geschützter Admin-Bereich (Login, Tour-/Stationen-CRUD)
- `src/lib/supabase` — Browser-/Server-/Proxy-Clients
- `src/lib/tours.ts` — geteilte Typen (Tour, Station)

## Status

Phase 1 (MVP) im Aufbau: Tour- und Stationen-Verwaltung im Studio, öffentlicher
Katalog samt Tour-Detailseite mit Karte und Player. Download/Offline (PWA) und
Payment (Stripe) folgen in Phase 2.
