# Digititeacher Design System — «Twilight Ridge» (v2)

Verbindliche Design-Referenz für alle öffentlichen Seiten. Weiterentwicklung
von «Sunset Trail» (v1), inspiriert durch: (a) Referenzbild gestaffelte
Bergkämme mit Tannensilhouetten, Türkis-Nebel und Magenta-Abendhimmel,
(b) poppr.be (weiche Scroll-Choreografie, Serifen-Typo, kuratierte
Farbdreiklänge), (c) ui-ux-pro-max «Aurora UI» (Tiefe durch Farbschichten,
langsame atmosphärische Animation).

## 1. Markenkern

Eine Erlebnisplattform für erzählte Wege — nicht Lern-App, nicht Outdoor-Tool.
Das visuelle Leitmotiv ist die **Blaue Stunde in den Bergen**: gestaffelte
Kämme, Nebel in den Tälern, der letzte Sonnenstreifen am Himmel. Jedes
Tour-Genre besetzt eine Farbe dieses Himmels.

## 2. Farbwelt

### 2.1 Basis (Tokens in `globals.css`)

Light Mode bleibt pergamentbasiert — Lesbarkeit bei Sonnenlicht auf dem Trail
ist nicht verhandelbar (Masterarbeit Kap. 8, PRD §8). Dark Mode ist die
Bühne für die Twilight-Stimmung des Referenzbilds.

| Token | Light (Tag / Trail) | Dark (Abend / Sofa) | Rolle |
|---|---|---|---|
| `--background` | `#FBF6EC` Pergament | `#101D22` Nachtpetrol | Grundfläche |
| `--foreground` | `#1F2E2C` Tannen-Petrol | `#F3ECDD` Pergament | Text |
| `--primary` | `#A9622A` Rost-Gold | `#D68A4C` Abendgold | CTA, Marker, Aktiv-Zustände |
| `--mist` (neu) | `#2E8C77` Nebelgrün | `#4FD6B8` Leucht-Mint | Sekundärakzent: Nebel, Fortschritt, Equalizer |
| `--dusk` (neu) | `#A83A63` Abendrot | `#E06B8A` Magenta-Rosé | Tertiärakzent: sparsam (Hero-Himmel, Genre Romantik) |
| übrige shadcn-Tokens | wie v1 | wie v1 | Cards, Borders, Muted |

Regeln:
- Gold bleibt der einzige CTA-/Interaktions-Akzent. Mist und Dusk sind
  Atmosphäre- und Genre-Farben, nie konkurrierende Buttons.
- Mint/Mist auf Pergament nur ≥ AA-Kontrast einsetzen (dunkle Variante
  `#2E8C77` für Text/Icons, helle `#4FD6B8` nur auf Petrol-Flächen).
- Der Hero-Himmel (Magenta→Pfirsich) existiert nur als Verlaufsfläche im
  Artwork, nie als UI-Farbe für Flächen/Text.

### 2.2 Genre-Akzente (aus dem Abendhimmel abgeleitet)

Jedes Erlebnis-Genre erhält einen Farbton des Twilight-Himmels als
Badge-/Detailfarbe — so bleibt die Vielfalt der Genres im selben Bild:

| Genre | Ton | Light | Dark |
|---|---|---|---|
| Wissen & Natur | Gold | `#A9622A` | `#D68A4C` |
| Kindergeschichte | Mint | `#2E8C77` | `#4FD6B8` |
| Romantischer Rundgang | Rosé | `#A83A63` | `#E06B8A` |
| Sagen & Mystik | Dämmerviolett | `#5B4A78` | `#8F7BB8` |
| Schule/Exkursion | Petrol | `#1F2E2C` | `#9FB8B2` |

Einsatz: Genre-Badge auf Tour-Karten, dünne Akzentlinie auf der
Tour-Detailseite, Pin-Farbe optional. Nicht mehr als ein Genre-Akzent
gleichzeitig sichtbar pro Karte.

## 3. Typografie (unverändert zu v1)

- Headlines: **Fraunces** (500–700, italic für betonte Wörter, `font-serif`)
- Fliesstext/UI: **Geist Sans**
- Skala: Hero 4xl–6xl · H2 3xl · Karten-Titel xl · Body base · Meta xs–sm
- Zeilenlänge 60–75 Zeichen, Zeilenhöhe 1.5–1.75

## 4. Signatur-Artwork: «Layered Ridges»

Das Hero-Artwork wird von 2 auf 4–6 Ebenen ausgebaut (Referenzbild):

1. **Himmelsband** oben: Verlauf `--dusk` → Pfirsich → transparent
   (Dark Mode kräftig, Light Mode nur ein Hauch am Horizont).
2. **3–5 Kamm-Ebenen** (SVG, `Ridgeline`-Komponente erweitert):
   hinten hell/blass, vorne dunkel/satt; vordere Ebenen mit
   Tannen-Fransen-Silhouette (gezackter Pfadrand).
3. **Nebelbänke** zwischen den Ebenen: Verlauf `--mist`/20 → transparent,
   von unten nach oben.
4. **Sonnen-Glow** (bestehend) in Gold, im Dark Mode intensiver.

Gleiche Komponente skaliert runter: Karten-Platzhalter (2 Ebenen + Nebel),
Footer (1 Ebene), Genre-Badges (Mini-Kamm optional).

## 5. Motion-Choreografie («sehr dynamisch», aber gezähmt)

Werkzeug: **framer-motion** (vorhanden) — `useScroll` + `useTransform` für
Scrub-Parallax, kein GSAP/WebGL nötig. Poppr-Feeling entsteht durch wenige,
präzise Effekte:

| Element | Effekt | Werte |
|---|---|---|
| Hero-Kammebenen | Scroll-Parallax, Ebene N bewegt sich mit Faktor 0.1–0.5 | scrub, keine Duration |
| Nebelbänke | dauerhafte Drift (translateX ±2%, opacity-Puls) | 10–14s, ease-in-out, loop |
| Hero-Text | Fade+Rise beim Laden | 0.5s, stagger 80ms (wie v1) |
| Sektionen | `Reveal` beim Scrollen (wie v1) | 0.55s, once |
| Tour-Karten | Hover-Lift + Bild-Zoom (wie v1), zusätzlich Genre-Akzentlinie animiert ein | 300ms |
| Player: aktive Station | Equalizer (v1) wechselt auf `--mist` | – |
| Seitenübergänge | Fade-Through (Template-Level) | 250ms |

Grenzen (aus Generator + a11y):
- Max. **eine** gescrubbte/gepinnte Sektion pro Seite (nur Hero).
- `prefers-reduced-motion`: Parallax + Drift aus, statisches Artwork.
- Nur `transform`/`opacity` animieren, nie Layout-Eigenschaften.
- Mobile: Parallax-Faktoren halbieren, Drift beibehalten (günstig).

## 6. Komponenten-Anpassungen (Delta zu v1)

- **Tour-Karte**: Genre-Badge (Farbton §2.2) statt nur Region-Chip;
  Platzhalter-Artwork mit Nebel-Ebene.
- **Katalog**: kuratierte Genre-Sektionen («Mit Kindern», «Zu zweit»,
  «Wissen & Natur») vor der Gesamtliste.
- **Tour-Detail**: dünne Genre-Akzentlinie unter dem Titel; Hero-Artwork
  in reduzierter Höhe wiederholt.
- **Player**: Fortschritt/Equalizer in Mist; GPS-Panel unverändert Petrol.
- **Studio**: bleibt funktional-schlicht, übernimmt nur Tokens.

## 7. Nicht verhandelbar (Guardrails)

- Light Mode: Textkontrast ≥ 4.5:1, Outdoor-Lesbarkeit vor Atmosphäre.
- Keine Emojis als Icons (lucide-react), Touch-Ziele ≥ 44px.
- Fokus-Ringe sichtbar (`--ring` = primary).
- Anti-Patterns (Generator): keine generischen Stockfotos, kein
  überladenes Layout, keine konkurrierenden CTAs.
