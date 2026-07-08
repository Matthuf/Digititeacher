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
  Fraunces-Serifen-Typografie, mehrschichtiges Parallax-Hero (SVG-Bergketten, Nebel, Sonne)
- Online-Player: GPS-Autoplay mit konfigurierbarem Toleranzradius, manuelles Play/Pause,
  ±15-Sekunden-Sprung, aufklappbares Transkript, Hörfortschritt (localStorage), Wake Lock
- Tour-/Stationen-Übersetzungen (DB-Modell) + Sprachumschalter auf der Tourseite (DE Basis, EN/IT/FR/RM)
- KI-Pipeline im Studio: DeepL-Übersetzung, ElevenLabs-Audioerzeugung pro Genre-Stimme
- Excel-Import für Touren (Vorlage-Download, Vorschau, toleranter Spalten-Parser)
- Fotos/Videos pro Station mit Medien-Karussell (nur sichtbar wenn Medien vorhanden)
- Hover-Effekte: Tour-Kacheln (Lift + Glow + Sheen), Nav-Links (Unterstrich)
- Migrationen 001–004 (genre, station-media/transcript/radius, translations, station_media)

## 🔲 Offen / geplant

Nach Priorität, kleine Aufwände zuerst:

1. **Rebrand auf „SendaLore"** – Wortmarke (Header/Footer), Claim im Hero,
   Metadaten/Browser-Titel, README, package.json-Name
2. **Sonne im Hero dynamisch/Hover** – Variante wählen:
   - (a) dezentes dauerhaftes Pulsieren, verstärkt bei Hover über den Hero-Bereich
   - (b) Sonne folgt leicht der Mausposition (Parallax-Cursor-Effekt)
   → Entscheidung mit Matt noch ausstehend
3. **Website-Oberfläche auf Englisch** – UI-Wörterbücher (de.json/en.json),
   Sprachschalter im Header, Cookie/State merkt Wahl. Später ggf. mit Tour-Sprache verknüpfen.
   (Unterscheidung: das hier ist die UI-Sprache, nicht die bereits vorhandene Touren-Übersetzung.)
4. **Coverbild-Upload für Touren** – aktuell nur URL-Feld im Studio, kein Direkt-Upload
5. **Katalog-Filter + Übersichtskarte + Suche** – Filter nach Genre/Dauer/Schwierigkeit/Region,
   Kartenansicht aller Touren, Volltextsuche
6. **Feedback/Bewertung + einfache Studio-Statistik** – Sterne/Kommentar nach Tourabschluss,
   Aufrufe/Abschlussquote/Abbruch-Stationen im Studio
7. **Quiz/Gamification** – nur optional für Kinder-/Schul-Genre, Punkte/Badges
8. **Offline-Modus / PWA** – Tour-Paket (Audio, Karten, Texte) für Offline-Nutzung im Gelände,
   Service Worker (Phase 2 laut PRD, als essenziell markiert)
9. **Payment/Stripe** – Einzelkauf pro Tour (Phase 2 laut PRD)
10. **ElevenLabs-Stimmen final eintragen** – Platzhalter-Stimmen pro Genre ersetzen durch
    die in der Masterarbeit vorgeschlagenen (Anhang lag im Upload nicht vollständig vor)

## Offene Fragen an Matt

- Sonne: Variante (a) oder (b)?
- Reihenfolge der offenen Punkte bestätigen oder umpriorisieren?
- ElevenLabs-Stimmnamen aus dem Drehbuch-Anhang nachreichen
- Ziel-Excel-Format (Spaltennamen) für Import abgleichen, falls abweichend von der Vorlage
