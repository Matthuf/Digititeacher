# SendaLore – Architektur-Analyse (Arbeitspaket 1)

Grundlage: `SendaLoreUIUXWeiterentwicklung.md`, Arbeitspaket 1 („Analyse und UI-Inventar“).
Reine Bestandsaufnahme, keine Codeänderungen. Ziel: Entscheidungsgrundlage für die
Arbeitspakete 2–9 der UI/UX-Weiterentwicklung.

---

## 1. Framework und Version

| | |
|---|---|
| Framework | Next.js **16.2.10**, App Router, Turbopack |
| Sprache | TypeScript 5, React 19.2.4 |
| Styling | Tailwind CSS **v4** (CSS-first, `@theme inline` in `src/app/globals.css`) |
| UI-Primitiven | shadcn/ui-Muster auf Radix (`@radix-ui/react-label`, `@radix-ui/react-slot`) + `class-variance-authority` |
| Motion | Framer Motion 12.42 (`src/components/reveal.tsx`) |
| Karten | Leaflet 1.9 + react-leaflet 5 |
| Backend | Supabase (Postgres, Auth, Storage, RLS) via `@supabase/ssr` |
| Zahlungen | Stripe SDK 22.3 (offizielles SDK, kein Eigenbau) |
| Fehler-Monitoring | `@sentry/nextjs` 10.65, DSN-gated (No-op ohne Env-Var) |
| Sonstige | `@turf/turf` (Geo-Berechnungen), `xlsx` (Studio-Import), `lucide-react` (Icons) |

Es gibt **keine** State-Management-Library (Redux/Zustand) – lokaler `useState`/`useRef`
in Client Components reicht bisher aus. Kein Test-Runner, kein Component-Testing-Setup.

---

## 2. Routing

App-Router mit drei Route-Gruppen:

```
src/app/
├── (site)/                      ← öffentliche Seiten, gemeinsames Layout
│   ├── page.tsx                 ← Startseite
│   ├── touren/page.tsx           ← Katalog
│   ├── touren/[slug]/page.tsx    ← Tourdetail + Player
│   ├── impressum/page.tsx
│   └── datenschutz/page.tsx
├── studio/                      ← Admin/CMS, eigenes Layout
│   ├── login/page.tsx
│   ├── (protected)/              ← Middleware-geschützt
│   │   ├── page.tsx               ← Tourliste + Stats
│   │   ├── import/page.tsx        ← Excel-Import
│   │   └── tours/[id]/page.tsx    ← Tour-Editor (Stationen, Medien, Quiz, Übersetzungen)
│   └── tours/new/page.tsx
└── api/
    ├── route/route.ts            ← Proxy zu OpenRouteService (Fussweg-Routing)
    └── webhooks/stripe/route.ts
```

Kein eigenes `[locale]`-Segment – Sprache läuft über `?lang=`-Query-Param (öffentliche
UI-Sprache) bzw. über den `lang`-i18n-Context, nicht über Next.js-i18n-Routing.

**Risiko für Arbeitspaket 3 (Filter):** Der Katalog (`touren/page.tsx`) hat noch keinen
URL-basierten Filterzustand (§5.1 der Anforderungen) – Filter/Suche sind aktuell
Client-State ohne Query-Param-Sync. Das ist der zentrale Umbau in Arbeitspaket 3.

---

## 3. Styling-Lösung

Ein einziges globales Farbsystem in `src/app/globals.css`, exakt nach
`SendaLore_Designregeln.md` benannt (`--sl-forest`, `--sl-copper`, `--sl-cream`, …),
auf shadcn-Aliase gemappt (`--primary`, `--background`, `--card`, …) und über
`@theme inline` als Tailwind-Utilities verfügbar (`bg-primary`, `text-muted-foreground`).

Es gibt **keinen Dark Mode** (bewusst, laut Designregeln: „Eine Palette, kein Dark
Mode“). Kategorie-Akzentfarben (`--cat-nature` etc.) existieren bereits.

**Fehlende Tokens laut Anforderungsdokument §15.3 / §12:**
- Kein `--space-*`-Spacing-Scale (Tailwind-Defaults werden direkt genutzt)
- Keine benannten Breakpoint-Tokens (nur Tailwind-Defaults `sm/md/lg/xl`)
- Keine Motion-Duration-Tokens (Dauerwerte sind in Komponenten hart codiert, z. B.
  `duration-500`, `0.35s` in `globals.css`)
- Kein Z-Index-Tokensystem (Overlay/Bottom-Sheet in `tour-player.tsx` nutzt `z-50` direkt)

Das ist die Lücke, die Arbeitspaket 2 („Design Tokens und Basiskomponenten“) schliessen soll.

---

## 4. Komponentenstruktur

```
src/components/
├── ui/                     shadcn-Primitiven: button, input, label, card
├── tour-card.tsx           Tourkarte (Katalog + Karussell)
├── tour-carousel.tsx       Highlight-Touren (Startseite)
├── tour-map.tsx / tour-map-inner.tsx   Leaflet, dynamic import (ssr:false)
├── tour-player.tsx         zentrale Spieler-Logik (GPS, Audio, States) – 927 Zeilen
├── tour-feedback.tsx       Bewertungen
├── media-carousel.tsx      Stationsbilder/-videos
├── purchase-gate.tsx       Kaufschranke + Restore-Flow
├── offline-download-button.tsx
├── station-coordinate-picker(-map).tsx  Studio: Karten-Picker
├── site-footer.tsx, twilight-ridges.tsx, ridgeline.tsx, reveal.tsx
└── i18n/t.tsx              <T k="..."/> Server/Client-Wrapper für dictionaries.ts
```

**Beobachtung:** `tour-player.tsx` trägt aktuell die gesamte Player-Logik (GPS-Watch,
Audio-Refs, Routing-Fetch, MediaSession, Wake-Lock, drei visuelle Zustände, Overview-
Sheet) in einer Datei. Für Arbeitspaket 6 (Tourmodus-Überarbeitung) sollte das in
kleinere Hooks/Komponenten aufgeteilt werden, bevor neue States (z. B. „ausserhalb der
Route“, „keine Verbindung“) dazukommen – sonst wächst die Datei unkontrolliert weiter.

Es gibt noch **keine** dedizierten Komponenten für: Bottom Sheet (generisch, wieder-
verwendbar – aktuell inline in `tour-player.tsx` gebaut), Filter Chip, Timeline, FAQ
Accordion, Sticky CTA, GPS-Status-Badge, Rating Input/Summary als eigenständige Einheit.
Diese fehlen laut §15.1 und müssten für die Arbeitspakete 3–6 neu entstehen.

---

## 5. Datenquellen / Tourdatenmodell

Supabase Postgres, Zugriff über `src/lib/supabase/{client,server,service}.ts` je nach
Kontext (Client Component / Server Component / Service-Role für RLS-Bypass).
Schema-Historie in `supabase/migrations/*.sql`, kumulativ auch in `supabase/schema.sql`.

**Aktuelles `Tour`-Modell** (`src/lib/tours.ts`):

```ts
type Tour = {
  id, title, slug, description, cover_image_url,
  region, duration_minutes, difficulty, genre,
  status, price, is_featured, created_at, updated_at,
};
```

**Ziel-Modell laut Anforderungsdokument §17** (`Tour`/`TourStation`) verlangt zusätzlich:
`subtitle`, `distanceKm`, `elevationGainM/LossM`, `stationCount` (aktuell nur über
`stations.length` ableitbar, kein persistiertes Feld), `targetGroups`, `tags`,
`startPoint`/`endPoint`/`route` (GeoJSON), `accessibility`, `equipment`, `arrival`,
`audioPreview`, `rating` (aggregiert), `isDemo`, `isFree`.

**Lücke, die vor Arbeitspaket 4 (Tourdetailseite) geschlossen werden muss:** Distanz,
Höhenmeter, Zielgruppe, Ausrüstung, Anreise, Barrierefreiheit, Hörprobe und aggregierte
Bewertung existieren in der DB **nicht**. `tour_feedback` liefert Einzelbewertungen, aber
keinen materialisierten Durchschnitt. Ohne diese Felder lässt sich P1.5/§6 nicht ohne
Fantasiedaten umsetzen – das braucht eine neue Migration, bevor die Detailseite befüllt
werden kann.

`Station` hat bereits: `latitude/longitude`, `audio_url`, `transcript`,
`trigger_radius_m`, `image_url` – deckt den Kern von `TourStation` (§17) weitgehend ab,
es fehlt nur `teaser` (aktuell überladen über `description`) und eine explizite
Entfernungs-ab-Start-Berechnung (liesse sich clientseitig aus den Koordinaten ableiten,
keine neue Spalte nötig).

---

## 6. Authentifizierung

Supabase Auth, ausschliesslich für das Studio (Admin-Tool). E-Mail/Passwort-Login
(`src/app/studio/login/page.tsx`, Server Action `signIn` in `src/app/studio/actions.ts`),
Middleware (`src/lib/supabase/proxy.ts` + Middleware-Datei) schützt `(protected)`.

Öffentliche Seiten haben **keine** Nutzerkonten – Fortschritt/Quiz/Käufe liegen in
`localStorage` (siehe Datenschutzerklärung). Das deckt sich mit Arbeitspaket 10 „Studio-
Login“: aktuell fehlen dort laut Anforderung „Passwort anzeigen“, „Passwort vergessen“,
differenzierte Fehlermeldung (aktuell zeigt `signIn` vermutlich generische Fehler – zu
prüfen bei Umsetzung von Arbeitspaket 10, nicht Teil dieser Analyse).

---

## 7. Geolocation

Browser-`navigator.geolocation.watchPosition` direkt in `tour-player.tsx`, kein Wrapper/
Hook. Bereits vorhanden: Hysterese (2 aufeinanderfolgende Fixes im Radius), Genauigkeits-
Hinweis (`accuracy > 50m` → „GPS schwach“-Text), Fehlertext aus `err.message` (roher
Browser-Text, nicht auf die in §7.5 geforderten sieben Zustände gemappt).

**Fehlend gegenüber §1.4/§7.5 der Anforderung:** kein `navigator.permissions.query`-
Check vor dem ersten `watchPosition`-Aufruf (d. h. der Zustand „noch nicht angefragt“
lässt sich nicht von „wird gerade gefragt“ unterscheiden), kein Zustand „ausserhalb der
Route“, kein strukturierter State-Enum (`idle/requesting/granted/inaccurate/denied/
unsupported/offline/outside-route` aus §15.2) – aktuell nur zwei Booleans
(`hasStarted`, `geoError`) plus die abgeleitete `weakGps`-Variable. Das ist exakt die
Lücke, die Arbeitspaket 5 („Standortdialog und GPS-Status“) schliessen soll.

---

## 8. Audio

`<audio>`-Element pro aktiver Station (`audioRefs` Map in `tour-player.tsx`), gesteuert
über Refs statt einer Player-Library. MediaSession API für Sperrbildschirm-Controls,
Wake Lock während aktiver Tour, bare `new Audio()`-Preload für die nächste Station.
Keine Lautstärkeregelung im UI (§7.4 fordert „Lautstärke“ als Pflichtfunktion – aktuell
nur über System-Regler des Geräts steuerbar). Keine Audio-Wellenform-Visualisierung
(§4.6, §11) – wäre eine neue, kleine Client-Komponente (Web Audio `AnalyserNode` oder
statisch, je nach Performance-Budget).

---

## 9. Kartenintegration

`react-leaflet`, dynamic import mit `ssr:false` (Leaflet ist nicht SSR-fähig), gemeinsame
Tile-Konfiguration in `src/lib/map-tiles.ts` (Thunderforest optional, OSM-Fallback).
Routing zur nächsten Station über eigenen `/api/route`-Proxy zu OpenRouteService
(Server-seitig, Key bleibt verborgen), mit Anker-basiertem Throttling. Karte wird aktuell
**immer sofort mitgerendert**, sobald die Tour gestartet ist – §6.2 fordert „Karte nicht
zwingend sofort laden“ + „statisches Vorschaubild als Fallback“, das ist auf der
Tourdetailseite (vor Tourstart) noch nicht umgesetzt, weil dort aktuell gar keine Karte
vor dem Start angezeigt wird (siehe Datenmodell-Lücke: kein `route`/`startPoint` ohne
Stationsdaten separat abzufragen).

---

## 10. Mehrsprachigkeit

Zwei getrennte Systeme, die nicht verwechselt werden dürfen:

1. **UI-Sprache** (Navigation, Buttons, Labels): `src/lib/i18n/dictionaries.ts`,
   `<T k="..."/>`, `useLanguage()`-Context. Nur `de`/`en`.
2. **Tour-Inhalte** (Titel, Beschreibung, Transkript): `tour_translations` /
   `station_translations`-Tabellen, feldweises Fallback auf die deutsche Basis
   (`localizeTour`/`localizeStations` in `lib/tours.ts`), gesteuert über `?lang=`.

Das Studio bleibt bewusst nur deutsch. Neue UI-Texte für die kommenden Arbeitspakete
(GPS-Zustände, FAQ, Eignungstexte) müssen in **beide** `dictionaries.ts`-Locales UND ggf.
in die content-seitigen Übersetzungstabellen einsortiert werden – abhängig davon, ob es
sich um feste UI-Copy oder redaktionellen Tour-Inhalt handelt.

---

## 11. Tests

**Es existiert kein automatisierter Test** – kein Unit-, Component- oder E2E-Test-Setup
(kein Jest/Vitest/Playwright/Testing-Library in `package.json`). §19 der Anforderung
listet umfangreiche Test-Pläne (Unit: Pluralisierung, Distanzformatierung, GPS-Status-
Mapping; E2E: kompletter Tour-Flow). Das ist aktuell komplett offen und nicht Teil dieser
Analyse-Phase, sollte aber vor bzw. parallel zu Arbeitspaket 9 eingeplant werden, da ohne
Tests jede GPS-/State-Logik-Änderung nur manuell verifizierbar ist.

---

## 12. CI/CD

**Keine GitHub Actions/Workflows im Repo** (`.github/workflows` existiert nicht). Deploy
läuft ausschliesslich über Vercel (automatisch bei Push auf den Branch). Es gibt also
aktuell keine automatisierte Lint/Build/Test-Gate vor dem Merge – Verifikation passiert
manuell (`npm run lint && npm run build`) vor jedem Commit, wie in den bisherigen
Sessions gehandhabt.

---

## 13. Design Tokens (Ist-Zustand)

Siehe Abschnitt 3. Zusammengefasst vorhanden: Farben (vollständig, konsistent mit
Designregeln), Radius (`--radius` + abgeleitete Stufen), Font-Familien (Serif/Sans über
`next/font`). Nicht vorhanden: Spacing-Scale, Motion-Duration-Tokens, Z-Index-Scale,
Container-Breiten als benannte Tokens (aktuell `max-w-3xl`/`max-w-6xl` direkt in JSX
verteilt).

---

## 14. Technische Risiken (priorisiert)

1. **Datenmodell-Lücke blockiert Arbeitspaket 4.** Ohne Distanz/Höhenmeter/Zielgruppe/
   Ausrüstung/Anreise/Accessibility/aggregierte Bewertung in der DB lässt sich die
   erweiterte Tourdetailseite nur mit Platzhalter- oder Fantasiedaten bauen. Empfehlung:
   vor Arbeitspaket 4 eine schlanke Migration (neue nullable Spalten, keine Pflichtfelder)
   plus Studio-Editor-Erweiterung einschieben.
2. **`tour-player.tsx` als Monolith.** 927 Zeilen, alle States/Effects in einer
   Client-Komponente. Weitere States (GPS-Enum, „ausserhalb der Route“, Lautstärke,
   Wellenform) sollten nicht einfach angehängt werden – vor Arbeitspaket 6 lohnt sich ein
   Refactor in Hooks (`useGeolocationState`, `useStationAudio`, `useRouteToNext`).
3. **Kein Test-Netz.** Jede Änderung an GPS-Logik/State-Maschine ist aktuell nur manuell
   verifizierbar (Browser-DevTools-Geolocation-Override). Bei den GPS-/Tourmodus-lastigen
   Arbeitspaketen (5, 6) steigt das Regressionsrisiko ohne zumindest ein paar Unit-Tests
   für die reine Formatierungs-/Statuslogik (isoliert von DOM/Browser-APIs testbar).
4. **Kein URL-State im Katalog.** Browser-Zurück und geteilte Filter-Links funktionieren
   heute nicht – das ist ein Kernkriterium von Arbeitspaket 3 und sollte früh (nicht als
   Nachtrag) mitgedacht werden, da es die Komponentenstruktur (Client vs. Server
   Component) beeinflusst.
5. **Keine CI-Gate.** Fehler werden erst bei manueller Prüfung vor dem Commit gefunden.
   Für ein Solo-Projekt mit dieser Arbeitsweise vertretbar, aber bei wachsendem Umfang
   (9 Arbeitspakete) steigt das Risiko, dass ein Build-Fehler unbemerkt gepusht wird.
   Kein Blocker für die UI/UX-Arbeitspakete, aber vormerken.

---

## 15. Empfehlung für die Reihenfolge

Die im Anforderungsdokument vorgeschlagene Reihenfolge (§16.1, §21) ist sinnvoll, mit
einer Ergänzung: **vor Arbeitspaket 4** sollte eine kleine, in sich abgeschlossene
Datenmodell-Erweiterung (Punkt 1 oben) eingeschoben werden, sonst entsteht bei der
Tourdetailseite Doppelarbeit (erst mit Platzhaltern bauen, dann nochmal mit echten
Daten). Alle anderen Arbeitspakete (2, 3, 5–9) sind mit dem bestehenden Datenmodell ohne
Vorarbeit umsetzbar.

Empfohlene Reihenfolge für die nächsten Schritte:

1. Arbeitspaket 2 – Design Tokens (Spacing/Motion/Z-Index ergänzen, keine Breaking Changes)
2. Arbeitspaket 3 – Tourkarten & Tourenübersicht (inkl. URL-Filterzustand)
3. Datenmodell-Erweiterung (neue Migration: Distanz, Höhenmeter, Zielgruppe, Ausrüstung,
   Anreise, Accessibility, Rating-Aggregation) – kurzer Zwischenschritt, kein eigenes
   Arbeitspaket im Dokument, aber Voraussetzung für Schritt 4
4. Arbeitspaket 4 – Tourdetailseite
5. Arbeitspaket 5 – Standortdialog & GPS-Status
6. Arbeitspaket 6 – Tourmodus (inkl. Player-Refactor)
7. Arbeitspaket 7 – Startseite
8. Arbeitspaket 8 – Motion & Polish
9. Arbeitspaket 9 – Accessibility & Performance
