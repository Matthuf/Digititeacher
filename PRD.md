# PRD: Audioguide-Publishing-Plattform

**Status:** Draft v1
**Autor:** Matt
**Zweck:** Grundlage für Weiterentwicklung mit Claude Code

---

## 1. Vision

Eine eigenständige Web-Plattform, auf der Matt professionelle Audiotouren (Audioguides) selbst erstellt, hostet und vertreibt. Besucher:innen können Touren online durchführen (GPS-gestützter Player im Browser) oder für die Offline-Nutzung herunterladen. Ein integriertes Zahlungssystem ermöglicht den Verkauf einzelner Touren.

Dies ist ein neues, eigenständiges Projekt (unabhängig vom bestehenden AudioTrail Creator), soll aber ähnliche fachliche Konzepte wiederverwenden dürfen (Stationen-Modell, Karten-Integration, TTS/Voice-Workflow).

## 2. Ziele (MVP)

1. Matt kann als einziger Ersteller (Admin) Touren im Backend anlegen und verwalten.
2. Jede Tour besteht aus mehreren Stationen mit: Geokoordinaten, Audiodatei, Titel, Beschreibungstext, optionalem Bild.
3. Touren werden auf einer öffentlichen Website gehostet und sind durchsuchbar/browsable.
4. Fokus MVP: **Erstellung & Hosting** – Download/Offline und Payment sind vorgesehen, aber nachgelagert (Phase 2/3, siehe Roadmap).

## 3. Nicht-Ziele (explizit nicht im MVP)

- Keine Multi-User-Verwaltung (keine weiteren Guides/Redakteure)
- Kein User-Generated-Content durch Endkunden
- Keine native Mobile App (Web/PWA reicht im MVP; native App ist als spätere Phase vorgesehen, siehe Abschnitt 9)
- Keine mehrsprachige UI im MVP (Content selbst kann mehrsprachig sein, UI vorerst DE)

## 4. Personas

- **Matt (Admin/Creator):** Erstellt Touren im geschützten Bereich, lädt Audio hoch, positioniert Stationen auf der Karte, veröffentlicht/depubliziert.
- **Gast/Besucher:** Entdeckt Touren auf der öffentlichen Seite, spielt sie online ab oder lädt sie herunter, bezahlt ggf. dafür (Phase 2).

## 5. Kernfunktionen

### 5.1 Tour-Erstellung (Studio-Bereich, geschützt/Login)
- Neue Tour anlegen: Titel, Beschreibung, Coverbild, Region/Ort, Dauer, Schwierigkeit
- Stationen hinzufügen: Position auf Karte setzen (Leaflet/OpenStreetMap), Audiodatei hochladen, Titel, Text
- Reihenfolge der Stationen per Drag & Drop
- Audiodatei-Verwaltung: Upload, Vorschau/Player, Ersetzen, Löschen
- Entwurf/Veröffentlicht-Status pro Tour
- Vorschau-Modus (Tour so ansehen, wie sie Gäste sehen würden)

### 5.2 Öffentliche Website
- Tour-Katalog (Übersichtsseite mit Filtern: Region, Dauer, Thema)
- Einzelne Tour-Detailseite (Beschreibung, Karte mit Stationen, Cover, Bewertungen später optional)
- Responsive, mobile-first (die meisten Nutzer sind unterwegs)

### 5.3 Guest-Erlebnis: Online-Player
- Interaktive Karte mit aktueller Position (Geolocation API)
- Automatisches oder manuelles Abspielen der Station, wenn Nähe erreicht
- Fortschrittsanzeige, Pause/Resume

### 5.4 Download/Offline (Phase 2)
- Tour als Paket herunterladbar (Audio + Karten-Daten) für Offline-Nutzung
- Idealerweise als PWA mit Service Worker (Offline-Caching), Alternative: ZIP-Download

### 5.5 Payment (Phase 2/3)
- Stripe-Integration für Einzelkauf pro Tour
- Kauf schaltet Online-Zugriff + Download frei
- Kein Abo-Modell im ersten Wurf (kann später ergänzt werden)

## 6. Datenmodell (Entwurf)

```
Tour
- id, title, slug, description, cover_image_url
- region, duration_minutes, difficulty
- status (draft | published)
- price (nullable, für Phase 2)
- created_at, updated_at

Station
- id, tour_id (FK)
- order_index
- title, description
- latitude, longitude
- audio_url, audio_duration_seconds
- image_url (optional)

Purchase (Phase 2)
- id, tour_id (FK), email, stripe_payment_id
- created_at

User (Admin only im MVP)
- id, email, password_hash
```

## 7. Architektur-Empfehlung

| Bereich | Empfehlung | Begründung |
|---|---|---|
| Frontend/Framework | Next.js (React) | SSR/SSG für gute Ladezeiten, ein Framework für Studio + öffentliche Seite |
| Backend/DB | Supabase (Postgres) | Managed, inkl. Auth und Storage, schnell für Solo-Projekt |
| Audio/Datei-Storage | Supabase Storage oder S3-kompatibel | Direkter Upload aus dem Studio |
| Karten | Leaflet + OpenStreetMap | Kostenlos, bereits Erfahrung von dir vorhanden |
| Payment | Stripe Checkout | Standard, wenig Aufwand für Einzelkäufe |
| Hosting | Vercel | Passt zu Next.js, einfaches Deployment |
| Offline/PWA | next-pwa oder eigener Service Worker | Für Download/Offline-Funktion in Phase 2 |

*Diese Empfehlung ist bewusst „langweilig" und bewährt – für ein Solo-Projekt ist Time-to-Market wichtiger als Exotik.*

### 7.1 Konkrete Libraries/Packages (für modernes, dynamisches UI)

| Zweck | Package | Warum |
|---|---|---|
| Styling-Basis | Tailwind CSS | Schnelles, konsistentes modernes Layout |
| UI-Komponenten | shadcn/ui | Fertige, anpassbare Komponenten statt Eigenbau |
| Animationen | Framer Motion | Flüssige Übergänge, Scroll-Reveals, Hover-Effekte |
| Icons | lucide-react | Konsistentes, cleanes Icon-Set |
| Offline/PWA | next-pwa | Grundlage für Download/Offline-Funktion (Phase 2) |

Diese Packages werden über npm ins Next.js-Projekt eingebunden (kein separates "Installieren" nötig) – Claude Code kann das Setup direkt übernehmen, wenn man es entsprechend beauftragt.

## 8. Nicht-funktionale Anforderungen

- Mobile-first, da Nutzung primär unterwegs auf dem Trail stattfindet
- Performance: Audiodateien komprimiert/gestreamt, nicht komplett vorab geladen
- Zuverlässiger GPS-Abgleich auch bei ungenauem Signal (Toleranzradius pro Station)
- Zugänglichkeit: ausreichender Kontrast, Lesbarkeit auch bei Sonnenlicht (Outdoor-Nutzung)

## 9. Roadmap / Phasen

**Phase 1 – MVP (Fokus dieser Anfrage)**
- Admin-Login, Studio zum Erstellen/Bearbeiten von Touren
- Öffentlicher Katalog + Tourdetailseite
- Online-Player mit Geolocation

**Phase 2**
- Download/Offline-Funktion (PWA)
- Payment via Stripe für Einzelkäufe

**Phase 3 (optional, später)**
- Mehrsprachigkeit
- Statistiken/Analytics pro Tour
- Multi-User (weitere Guides)

**Phase 4 (langfristig)**
- Native App (iOS/Android), z. B. via React Native oder Capacitor, um die bestehende Web-Codebasis wiederzuverwenden
- Bewusst kein Vorrang – relevant erst, wenn Plattform und Content sich bewährt haben. Bei der Architekturwahl (Next.js/React) in Phase 1 lohnt es sich aber, Komponenten so zu bauen, dass sie später leichter in eine App-Umgebung übernommen werden können

## 10. Offene Fragen (für dich zu klären, bevor Claude Code loslegt)

- Domainname / Branding?
- Wie viele Touren realistisch im ersten Jahr (Datenvolumen-Abschätzung Audio-Storage)?
- Soll Segnes-Panoramaweg als erste Tour auf die neue Plattform migriert werden?
- Preisvorstellung pro Tour (für spätere Payment-Phase)?

---

*Nächster Schritt: Dieses PRD mit Claude Code als Ausgangspunkt verwenden, Phase 1 (MVP) zuerst implementieren lassen.*
