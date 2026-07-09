# SendaLore Designregeln

## Rolle dieses Dokuments

Dieses Dokument definiert die verbindlichen Designregeln für Claude Code im Projekt **SendaLore**.  
Ziel ist ein hochwertiges, modernes digitales Produkt für GPS-basierte Audiotouren.  
Die Website darf atmosphärisch und erzählerisch wirken, aber nie wie eine poetische Kulturseite, ein Museumskatalog oder ein reines Editorial-Projekt.

Bei jedem Design- und Code-Entscheid gilt diese Priorität:

1. Mobile Nutzbarkeit draussen am Smartphone
2. Klarer digitaler Produktcharakter
3. Hochwertige, ruhige Markenwirkung
4. Konsistente UI-Komponenten
5. Zurückhaltende Storytelling-Atmosphäre

---

## Produktpositionierung

**SendaLore** ist eine browserbasierte Plattform für GPS-Audiotouren.  
Nutzer öffnen einen Link, gehen los und hören ortsbezogene Geschichten automatisch an den passenden Stationen.

### Claim

**EN:** Stories that walk with you  
**DE:** Geschichten, die deinen Weg begleiten.

### Produktversprechen

SendaLore verbindet einfache Technologie mit sorgfältig kuratierten Audioerlebnissen.  
Die Marke steht für Orientierung, Qualität, Ruhe und unmittelbares Erleben vor Ort.

### SendaLore ist

- hochwertig
- modern
- klar
- mobil nutzbar
- ruhig
- vertrauenswürdig
- ortsbezogen
- erzählerisch, aber kontrolliert

### SendaLore ist nicht

- verspielt
- romantisierend
- museal
- touristisch-klischeehaft
- generisch wie eine Standard-Wanderapp
- technisch kalt wie ein SaaS-Dashboard
- überladen mit Dekoration

---

## Designprinzipien

### 1. Digital zuerst

Alle Komponenten müssen auf Mobile funktionieren.  
Outdoor-Lesbarkeit ist wichtiger als feine Eleganz.

### 2. Ruhige Premium-Wirkung

Die Seite soll hochwertig wirken, aber nicht luxuriös oder elitär.  
Whitespace, klare Hierarchie und reduzierte UI sind wichtiger als Dekoration.

### 3. Storytelling als Akzent, nicht als Layoutprinzip

Storytelling darf in Claim, Hero und Bildwelt spürbar sein.  
Navigation, Filter, Karten, Buttons und Metadaten bleiben funktional und klar.

### 4. Keine Mini-Gemälde als UI

Illustrationen dürfen atmosphärisch sein.  
Für UI-Elemente, Icons, Karten und kleine Flächen müssen sie reduziert, kontrastreich und skalierbar bleiben.

---

## Farbssystem

Die Marke basiert auf dunklem Tannengrün, warmem Creme und Kupfer als Akzent.

```css
:root {
  --sl-forest: #18312B;
  --sl-forest-2: #203D36;
  --sl-cream: #F7F1E6;
  --sl-cream-2: #EFE6D7;
  --sl-copper: #B6672A;
  --sl-copper-dark: #99531F;
  --sl-sage: #8FA59A;
  --sl-mist: #D7DED4;
  --sl-rose: #E9C8C5;
  --sl-text: #1D2C29;
  --sl-text-muted: #6F6A60;
  --sl-border: #E4D8C7;
  --sl-white-soft: #FFFDF8;
}
```

### Farbrollen

| Rolle | Farbe | Verwendung |
|---|---|---|
| Primär | `--sl-forest` | Logo, Headlines, zentrale Texte |
| Aktion | `--sl-copper` | Buttons, aktive Zustände, Pfeile, Audiopunkte |
| Hintergrund | `--sl-cream` | Seitenhintergrund |
| Fläche | `--sl-white-soft` | Cards, Eingaben, Panels |
| Sekundärtext | `--sl-text-muted` | Metadaten, Beschreibungen |
| Linie | `--sl-border` | Borders, Divider |
| Atmosphäre | `--sl-rose`, `--sl-sage`, `--sl-mist` | Hero, Illustrationen, Kategorieakzente |

### Regeln

- Kupfer ist Akzentfarbe, nicht Hauptfarbe.
- Primäre CTAs dürfen Kupfer verwenden.
- Headlines bleiben dunkelgrün.
- Sekundärtexte müssen draussen auf Mobile lesbar bleiben.
- Keine reinen Schwarz- oder Weissflächen verwenden.
- Keine grellen Tourismusfarben einsetzen.

---

## Typografie

Die Typografie muss hochwertig wirken, aber robust und digital nutzbar bleiben.

### Empfohlene Schriftkombination

```css
:root {
  --font-display: "Lora", "Source Serif 4", Georgia, serif;
  --font-ui: "Source Sans 3", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

### Rollenverteilung

| Bereich | Schrift |
|---|---|
| Logo/Wortmarke | Display Serif |
| Hero-Headline | Display Serif |
| Wichtigste Abschnittstitel | Display Serif |
| UI, Navigation, Buttons | UI Sans |
| Fliesstext | UI Sans |
| Suchfeld, Filter, Tabs | UI Sans |
| Metadaten | UI Sans |
| Tourtitel | bevorzugt UI Sans Semibold oder zurückhaltende Display Serif |

### Wichtige Regel

Serif ist Markenakzent.  
Sans ist Produktstandard.

Die Website soll nicht vollständig editorial wirken.  
UI-nahe Elemente immer in Sans setzen.

### Konkrete Empfehlung für aktuelle Website

- Hero-Headline darf Serif bleiben.
- Das hervorgehobene Wort im Claim darf italic und kupferfarben sein.
- Kategorie-Headlines dürfen Serif nutzen, aber nicht zu gross und nicht zu schwer.
- Tourkarten-Titel sollen getestet werden:
  - Variante A: Sans Semibold für mehr Produktklarheit
  - Variante B: Serif kleiner und ruhiger
- Navigation, Buttons, Filter und Metadaten immer Sans.

### Typografische Richtwerte

```css
.hero-title {
  font-family: var(--font-display);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.02em;
}

.section-title {
  font-family: var(--font-display);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.015em;
}

.body-text {
  font-family: var(--font-ui);
  font-weight: 400;
  line-height: 1.55;
}

.ui-label,
.nav-link,
.button,
.meta {
  font-family: var(--font-ui);
}
```

---

## Logo und Markenelement

### Wortmarke

Die primäre Wortmarke ist:

**SendaLore.**

Der Punkt in Kupfer ist ein zentrales Markenelement.  
Er kann als Erzählpunkt, Audiopunkt, GPS-Station oder Sonne interpretiert werden.

### Regeln

- In der Navigation bevorzugt reine Wortmarke verwenden.
- Keine komplexen Landschaftslogos in der Navigation.
- Der Punkt bleibt kupferfarben.
- Die Wortmarke muss auf Mobile ruhig und klar lesbar bleiben.

### Logo-System

| Anwendung | Variante |
|---|---|
| Header | Wortmarke `SendaLore.` |
| Footer | Wortmarke + Claim |
| Favicon | reduziertes S-/Punkt-/Pfad-Symbol |
| App-/PWA-Icon | reduziertes Symbol, kein komplexes Landschaftsbild |
| Marketing/Print | Badge mit Landschaft möglich |

---

## Layout und UI

### Grundsatz

Die UI soll wie ein digitales Produkt wirken: klar, bedienbar, direkt.  
Atmosphäre entsteht über Farben, Illustrationen und Tonalität, nicht über komplizierte Layouts.

### Mobile First

Alle zentralen Funktionen müssen mit einer Hand bedienbar sein.  
Tap-Ziele mindestens 44 px hoch.  
Keine zu feinen Linien oder zu kleinen Metadaten.

### Header

Aktueller Header ist auf Mobile eher dicht.

Empfehlung:

- Links: `SendaLore.`
- Rechts: `Touren` und Sprachumschalter
- `Studio` nicht prominent in der Hauptnavigation zeigen, sofern es kein zentraler Bereich für Endnutzer ist.
- Header nicht dekorieren.
- Navigation immer Sans.

### Buttons

Primäre Buttons sind kupferfarben und klar erkennbar.

```css
.button-primary {
  background: var(--sl-copper);
  color: var(--sl-white-soft);
  border-radius: 999px;
  font-family: var(--font-ui);
  font-weight: 700;
  min-height: 48px;
  padding: 0 24px;
}

.button-primary:hover,
.button-primary:focus-visible {
  background: var(--sl-copper-dark);
}
```

### Inputs und Filter

Suchfelder und Filter müssen funktional wirken.

- Sans verwenden
- genug Kontrast
- klare aktive Zustände
- keine zu dekorativen Borders
- bei wenigen Touren Suche/Filter nicht überprominent einsetzen

---

## Hero-Bereich

Der Hero ist der wichtigste Markenmoment.  
Er darf emotional sein, muss aber produktklar bleiben.

### Empfohlene Struktur

1. Kleine Eyebrow: `GPS-Audiotouren zum Erleben`
2. Headline: `Geschichten, die deinen Weg begleiten.`
3. kurzer Produktnutzen
4. klarer CTA: `Touren entdecken`
5. reduzierte Landschaftsillustration

### Empfohlener Hero-Text

**Geschichten, die deinen Weg begleiten.**

Audiotouren für Natur, Kultur und kleine Abenteuer.  
Die Geschichten starten automatisch dort, wo du gerade stehst. Ohne App.

### Regeln

- Claim nicht überladen.
- Weniger Text ist besser.
- `Ohne App` ist stärker als `Direkt im Browser`.
- CTA muss sofort sichtbar sein.
- Landschaft unten bleibt atmosphärisch, darf aber Inhalt nicht verdrängen.

---

## Tour-Cards

Tour-Cards sind zentrale Produktkomponenten.  
Sie müssen stärker nach digitalem Produkt als nach Buchcover aussehen.

### Card-Struktur

1. Bild / Illustration
2. Kategorie-Badge
3. Audio-Indikator
4. Titel
5. Kurzbeschreibung oder Tourtyp
6. Ort
7. Dauer
8. Schwierigkeit, falls vorhanden
9. klarer CTA

### Empfehlung

Ein Icon-Pfeil allein ist zu subtil.  
Besser:

- `Tour öffnen →`
- oder `Starten`
- oder klarer Button innerhalb der Card

### Card-Regeln

- Karten nicht zu dunkel und nicht zu ähnlich gestalten.
- Jede Tour braucht differenzierende Kategorie-Farbe oder Bildstimmung.
- Tourtitel gut scannbar halten.
- Metadaten in Sans.
- Badge-Farbe systematisch verwenden.
- Card muss komplett klickbar sein.

### Beispiel-CSS

```css
.tour-card {
  background: var(--sl-white-soft);
  border: 1px solid var(--sl-border);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgb(24 49 43 / 0.08);
}

.tour-card-title {
  font-family: var(--font-ui);
  font-weight: 700;
  color: var(--sl-forest);
  line-height: 1.2;
}

.tour-card-meta {
  font-family: var(--font-ui);
  color: var(--sl-text-muted);
  font-size: 0.95rem;
}

.tour-card-cta {
  color: var(--sl-copper);
  font-family: var(--font-ui);
  font-weight: 700;
}
```

---

## Kategorien

Kategorien helfen Orientierung und Differenzierung.  
Farben müssen systematisch bleiben.

```css
:root {
  --cat-nature: #B6672A;
  --cat-children: #3B9C91;
  --cat-culture: #7F6A9F;
  --cat-couple: #C47C6D;
  --cat-history: #8A7355;
}
```

| Kategorie | Farbe | Wirkung |
|---|---|---|
| Wissen & Natur | Ocker/Kupfer | Natur, Wissen, Landschaft |
| Kindergeschichte | Türkis/Teal | leicht, zugänglich, frisch |
| Kultur & Geschichte | gedämpftes Violett/Braun | kulturell, ruhig |
| Rundgang zu zweit | warmes Rosé/Kupfer | persönlich, weich |
| Sagen & Mythen | dunkles Grün/Kupfer | geheimnisvoll, aber nicht kitschig |

### Regeln

- Kategorie-Farbe nur als Akzent nutzen.
- Keine vollflächig bunten Karten.
- Kategorie-Badges müssen gut lesbar sein.
- Kategorie-Headlines dürfen Serif nutzen, aber nicht zu dominant werden.

---

## Icons

Icons sind funktional und ruhig.

### Stil

- Line icons
- abgerundete Enden
- 1.75 bis 2 px Stroke
- kupferfarben oder dunkelgrün
- Icon-Hintergrund hell creme
- keine detailreichen Illustrationen als Icons

### Einsatz

| Icon | Bedeutung |
|---|---|
| Navigation/GPS | GPS-Autoplay |
| Smartphone | Keine App nötig |
| Stift | sorgfältig erstellt |
| Kopfhörer | Audio verfügbar |
| Uhr | Dauer |
| Pin | Ort |
| Karte | Kartenansicht |
| Liste | Listenansicht |

---

## Bild- und Illustrationsstil

### Stil

- reduzierte alpine Landschaften
- Layering mit Nebelgrün und Salbei
- dunkler Vordergrund
- weiche Sonne/Punkt in Kupfer
- keine Fotorealistik
- keine überzeichnete Märchenwelt
- keine generischen Stockfotos

### Regeln

- Illustrationen dürfen Stimmung schaffen, aber UI nicht schwächen.
- Für Tourkarten müssen Motive unterscheidbar sein.
- Hero-Illustration darf weicher sein als Card-Illustrationen.
- Kleine Flächen brauchen weniger Details.

---

## Sprache und Tonalität

SendaLore spricht klar, ruhig und produktnah.

### Ton

- direkt
- hochwertig
- freundlich
- nicht werblich überdreht
- nicht poetisch überladen
- nicht technisch trocken

### Gute Formulierungen

- `Ohne App. Direkt im Browser.`
- `Die Erzählung startet automatisch vor Ort.`
- `Tour öffnen`
- `Loswandern und zuhören`
- `Geschichten, die deinen Weg begleiten.`
- `Sorgfältig recherchiert und erzählerisch aufbereitet.`

### Formulierungen vermeiden

- `mystisch` zu häufig
- `magisch`
- `tauche ein`
- `einzigartige Reise`
- `unvergessliches Erlebnis`
- `handgemacht`, falls später KI-Stimmen oder Übersetzungen genutzt werden
- zu lange poetische Absätze

### Ersatz für „Von Hand gemacht“

Aktuell nur verwenden, wenn jede Tour wirklich selbst vertont und manuell geschrieben ist.

Skalierbarer:

**Sorgfältig erstellt**  
Jede Tour ist recherchiert, geschrieben und erzählerisch aufbereitet.

Oder:

**Lokal recherchiert**  
Sorgfältig geschrieben, klar erzählt und direkt vor Ort erlebbar.

---

## Informationsarchitektur

### Startseite

Empfohlene Reihenfolge:

1. Hero
2. Produktvorteile
3. Empfohlene Touren
4. Kategorien oder alle Touren
5. Vertrauens-/Qualitätsblock
6. Footer

### Tourenübersicht

Bei wenigen Touren:

- Suche und Filter zurückhaltend einsetzen
- keine leere Plattformwirkung erzeugen
- Touren stärker kuratieren: `Empfohlene Touren`

Bei vielen Touren:

- Suche
- Genre-Filter
- Liste/Karte-Umschalter
- Sortierung optional

### Studio

`Studio` nur prominent zeigen, wenn es für normale Nutzer relevant ist.  
Falls es Creator-/Admin-Bereich ist, gehört es in den Footer oder hinter Login.

---

## Accessibility und UX

### Mindestanforderungen

- gute Textkontraste
- sichtbare Focus States
- Buttons mindestens 44 px hoch
- keine relevanten Informationen nur über Farbe vermitteln
- Tour-Cards per Tastatur erreichbar
- Sprache korrekt auszeichnen (`lang="de"` / `lang="en"`)
- Icons mit Labels oder `aria-label`
- reduzierte Animationen bei `prefers-reduced-motion`

### Outdoor-Kontext

Nutzer verwenden die Seite unterwegs.  
Daher:

- keine feinen, hellgrauen Texte
- keine versteckten CTAs
- kein unnötiger Scroll-Aufwand vor dem Start
- GPS-/Audio-Status klar anzeigen
- Offline-/Browser-Hinweise verständlich halten

---

## Konkrete Anpassungen am aktuellen Prototyp

### Priorität 1

- Header auf Mobile vereinfachen.
- `Studio` aus Hauptnavigation entfernen oder weniger prominent platzieren.
- Hero-Text kürzen und `Ohne App` stärker machen.
- Tour-Card-CTA deutlicher machen.
- Sekundärtexte minimal dunkler setzen.

### Priorität 2

- Tourtitel testweise in Sans Semibold setzen.
- Kategorie-Farben final definieren.
- Tourbilder stärker differenzieren.
- Suche/Filter bei nur wenigen Touren weniger prominent machen.

### Priorität 3

- reduziertes Favicon/PWA-Icon entwickeln.
- Badge-System für Marketing und Print definieren.
- Design Tokens zentralisieren.
- Komponenten systematisch dokumentieren.

---

## Do's and Don'ts

### Do

- Dunkelgrün als starke Markenbasis nutzen.
- Kupfer für Aktionen und aktive Zustände verwenden.
- UI-Komponenten klar und digital halten.
- Text kurz und verständlich schreiben.
- Mobile Screens zuerst prüfen.
- Touren kuratiert präsentieren.
- Serif gezielt für Marke und Hauptmomente einsetzen.

### Don't

- Kupfer grossflächig übernutzen.
- UI mit Serif überladen.
- zu poetische Texte schreiben.
- CTA nur als kleines Icon verstecken.
- Suche/Filter bei wenigen Touren dominant platzieren.
- komplexe Logos in der Navigation verwenden.
- zu viele ähnliche dunkle Tourbilder verwenden.

---

## Claude-Code-Arbeitsanweisung

Bei jeder Änderung am Projekt:

1. Prüfe, ob die Änderung SendaLore klarer, nutzbarer und hochwertiger macht.
2. Bevorzuge digitale Produktklarheit gegenüber poetischer Inszenierung.
3. Halte UI-Texte kurz.
4. Verwende Design Tokens statt harter Einzelwerte.
5. Prüfe Mobile zuerst.
6. Achte auf Kontrast und Tap-Ziele.
7. Nutze Serif nur dort, wo Markenwirkung entsteht.
8. Nutze Sans für Interaktion, Orientierung und Information.
9. Vermeide unnötige Animationen, Schatten und dekorative Elemente.
10. Erzeuge keine generischen Tourismus-Layouts.

---

## Akzeptanzkriterien für neue UI-Komponenten

Eine neue Komponente ist nur passend, wenn sie alle Kriterien erfüllt:

- Sie ist auf Mobile gut bedienbar.
- Sie verwendet die definierten Farben und Schriften.
- Sie hat klare Zustände: default, hover, focus, active, disabled.
- Sie ist zugänglich beschriftet.
- Sie wirkt digital und nicht editorial.
- Sie unterstützt den Touren-Use-Case.
- Sie bleibt auch mit längeren deutschen Texten stabil.

---

## Kurzfassung für schnelle Entscheidungen

**SendaLore soll wirken wie:**  
ein hochwertiges, modernes, mobiles Audio-Tour-Produkt.

**SendaLore soll nicht wirken wie:**  
eine poetische Kulturseite oder ein klassisches Tourismusprospekt.

**Visuelle Leitidee:**  
Dunkles Grün, Creme und Kupfer. Ruhig, klar, digital. Storytelling dosiert.

**Typografische Leitidee:**  
Serif für Marke. Sans für Produkt.

**UX-Leitidee:**  
Nutzer öffnen eine Tour, gehen los und hören zu. Jede UI-Entscheidung muss diesen Ablauf vereinfachen.
