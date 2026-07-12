# SendaLore – Wettbewerbsanalyse & Massnahmenplan

Stand: Juli 2026. Branch `claude/digititeacher-repo-setup-eggh3v`. Alle Code-Befunde sind mit Dateipfad (und wo sinnvoll Zeilennummer) belegt; alle Marktbefunde mit Quelle (siehe Abschnitt „Quellen"). Wo ich mir bei einer Aussage nicht sicher bin oder keine belastbare Quelle gefunden habe, steht das explizit dabei, statt zu raten.

---

## 1. Management Summary

SendaLore ist technisch für ein Solo-Nebenprojekt ungewöhnlich vollständig: Studio-CMS, GPS-Player, Übersetzungen, Quiz, Stripe-Checkout und PWA-Grundgerüst existieren bereits – das ist mehr, als die meisten Konkurrenten in ihrer Frühphase hatten. Der grösste Hebel liegt aber nicht in weiteren Features, sondern in drei konkreten Lücken: Erstens ist die „Offline"-Fähigkeit nur halb echt (Audio/Bilder ja, Kartenkacheln nein) – genau im Kernszenario „Wandern ohne Netz in den Bergen" fällt die Karte aus. Zweitens ist der Stripe-Kauf nicht geräteübergreifend nutzbar, weil die Freischaltung nur im `localStorage` liegt, nicht an einen Account oder E-Mail-Nachweis gebunden. Drittens fehlt die einfachste SEO-Grundlage (individuelle Metadaten pro Tour) – jeder geteilte Link zeigt den generischen Seitentitel statt Tourname und Bild. Im Vergleich zu izi.TRAVEL/VoiceMap/SmartGuide ist die grösste strukturelle Schwäche nicht die Technik, sondern die fehlende Distribution: Wanderer suchen ihre Route in Komoot, Outdooractive oder SchweizMobil, nicht in einer Audioguide-App – das ist ein Positionierungsproblem, das kein Code löst. Die ehrliche Nische von SendaLore ist die regionale Kuratierung und Genre-Vielfalt (Kinder/Romantik/Sagen) für den Alpenraum, nicht der Versuch, mit globalen Marktplätzen in Reichweite zu konkurrieren. Die priorisierte Liste unten sortiert entsprechend: zuerst günstige Fixes mit rechtlicher/SEO-Relevanz, dann die echte Offline-Fähigkeit, danach die kontogebundene Kaufabwicklung – Multi-User/Mandantenfähigkeit für B2B-Zielgruppen kommt bewusst erst in Phase 3.

---

## 2. Ist-Zustand meiner Plattform (Code-Befunde)

### 2.1 Datenmodell

Neun Tabellen in `supabase/schema.sql`: `tours`, `stations`, `purchases`, `tour_translations`, `station_translations`, `station_media`, `tour_feedback`, `tour_views`, `station_quiz`.

- **Kein Rollen-/Mandantenmodell.** Es gibt keine `users`/`profiles`/`roles`-Tabelle. Sämtliche Schreib-Policies prüfen nur `auth.role() = 'authenticated'` (z. B. `supabase/schema.sql:70–78`, `:141–149`, `:181–184`). Das bedeutet: Jede eingeloggte Person hat automatisch Vollzugriff auf **alle** Touren, nicht nur eigene. Für die im Auftrag genannten B2B-Zielgruppen (Gemeinden, Naturpärke, Schulen) ist das eine harte Grenze, sobald mehr als eine Institution Zugriff braucht – aktuell ist das Produkt strukturell Single-Tenant.
- **`purchases` ist nicht an einen Nutzer-Account gekoppelt.** Nur `email` und `stripe_payment_id`, keine Session-/Login-Verknüpfung (`supabase/schema.sql:39–45`). Es existiert nur eine `select`-Policy für `authenticated` (`supabase/schema.sql:310`); Schreibzugriff läuft ausschliesslich über den Service-Role-Key im Stripe-Webhook. Die eigentliche Freischaltung im Player ist eine reine `localStorage`-Markierung (`src/components/purchase-gate.tsx`), gesetzt nach einer clientseitig ausgelösten, serverseitig verifizierten Prüfung der Checkout-Session (`src/app/(site)/touren/[slug]/page.tsx`). Das funktioniert nur auf demselben Gerät/Browser – ein Kauf ist nicht wiederherstellbar.
- **Keine Multi-Currency.** `src/lib/payments/stripe.ts:34` setzt `currency` hart auf `"chf"`.
- **`stations.trigger_radius_m`** ist optional pro Station mit sinnvollem Default (`src/components/tour-player.tsx:28`, `40`m) – granular genug für unterschiedliche Geländearten.

### 2.2 Routing- und Seitenstruktur

Öffentlich: `/`, `/touren`, `/touren/[slug]`. Studio (Auth-geschützt über `(protected)`-Segment): `/studio`, `/studio/login`, `/studio/tours/new`, `/studio/tours/[id]`, `/studio/import`. API: `/api/webhooks/stripe`, `/api/route` (Wegführung).

- **Keine Impressum-, Datenschutz- oder AGB-Seite** im Repo auffindbar. Für ein Produkt mit Zahlungsabwicklung (Stripe) und Erfassung von E-Mail-Adressen ist das für den Schweizer/EU-Markt ein offener rechtlicher Punkt (keine Rechtsberatung, aber ein Fakt: die Seiten fehlen schlicht).
- **Kein `sitemap.xml`/`robots.ts`** im `src/app`-Verzeichnis.

### 2.3 Player (`src/components/tour-player.tsx`, 890 Zeilen)

- GPS-Trigger: `navigator.geolocation.watchPosition` mit `enableHighAccuracy: true`; pro Positions-Update linearer Scan aller noch nicht ausgelösten Stationen via Haversine-Distanz (`src/lib/geo.ts`) gegen `trigger_radius_m` (Default 40 m, Zeile 28/311).
- **Keine Hysterese/Mindestverweildauer.** Ein einzelner GPS-Ausreisser innerhalb des Radius reicht zum Auslösen; es gibt keine Prüfung auf mehrere aufeinanderfolgende Positionsupdates.
- **`coords.accuracy` wird nie ausgelesen oder angezeigt** (kein Treffer im ganzen Player). Der Nutzer erfährt nie, wie genau sein GPS-Signal gerade ist – bei schlechtem Signal gibt es nur den manuellen „Ich bin da"-Button als Fallback, aber keinen Hinweis, dass das Signal schwach ist.
- Audio: natives `<audio>`, `preload="auto"` nur für die aktuell aktive Station. **Kein Preload der nächsten Station**, obwohl deren Distanz/Route bereits bekannt ist (`nextStation`-Logik existiert für die Kartenanzeige, wird aber nicht zum Vorab-Laden der Audiodatei genutzt) – bei jedem Stationswechsel beginnt das Laden bei Null.
- Fortschritt/Quiz-Antworten liegen in `localStorage`, nicht geräteübergreifend.

### 2.4 Offline/PWA

- Service Worker (`public/sw.js`, 25 Zeilen) cached ausschliesslich Audio- und Bild-URLs, die der Nutzer explizit über den „Für offline speichern"-Button anfordert (`src/lib/offline.ts`).
- **Kartenkacheln werden nicht vorab gecacht.** Weder die Leaflet-Tiles (OSM/Thunderforest) noch die Route-Antworten von `/api/route` sind Teil der Offline-Strategie. In einem echten Funkloch – dem Kernszenario für Alpen-Wanderungen – bricht die Kartenansicht optisch weg, während Audio ggf. noch funktioniert. Das ist keine Kleinigkeit, sondern eine Lücke im zentralen Use-Case.

### 2.5 Studio/CMS – Schritte bis zur Veröffentlichung (durchgezählt)

Anhand `src/app/studio/(protected)/tours/new/page.tsx`, `.../tours/[id]/page.tsx`, `src/app/studio/actions.ts`:

1. Login (`/studio/login`)
2. „Neue Tour anlegen": Titel Pflichtfeld, weitere Felder optional → Submit
3. Auf der Tour-Detailseite: Beschreibung/Region/Dauer/Schwierigkeit/Preis/Genre/Highlight-Flag ausfüllen → Speichern
4. **Pro Station** ein eigenes Formular: Titel, **Breiten-/Längengrad als reine Zahlenfelder** (kein Karten-Klick-Picker), Audio-URL oder Datei-Upload, Transkript, Trigger-Radius → Speichern. Bei einer typischen Tour mit 8–10 Stationen sind das 8–10 Wiederholungen dieses Schritts.
5. Optional je Station: Cover-Bild, Fotos/Videos, Quiz (nur Genre kinder/schule), Übersetzungen
6. Status von „Entwurf" auf „Veröffentlicht" umstellen → Speichern

**Konkreter Reibungspunkt:** Es gibt kein Karten-Interface zum Setzen der GPS-Koordinaten – Matt muss Lat/Lng anderswo (z. B. Google Maps) nachschlagen und als Zahl abtippen, pro Station. Der Excel-Import (`src/lib/import/parse.ts`, `/studio/import`) hilft bei Masseneingabe, verlangt aber ebenfalls Lat/Lng als Zahlen in der Tabelle – das eigentliche Problem (Koordinaten woanders beschaffen) bleibt bestehen.

### 2.6 Performance

- `package.json` zeigt eine schlanke Abhängigkeitsliste; shadcn-Komponenten sind selbst geschrieben statt als Paket importiert.
- `xlsx` (schwer) ist nur in `src/components/tour-import.tsx` importiert – einer Client-Komponente, die ausschliesslich auf `/studio/import` lädt, hinter Login. Kein Einfluss auf das Public-Bundle.
- **Bilder laufen durchgängig über rohes `<img>`, nicht `next/image`** (`src/components/media-carousel.tsx`, `src/components/tour-card.tsx`, `src/app/(site)/touren/[slug]/page.tsx`). Das war eine bewusste Entscheidung für Konsistenz mit dem Offline-Cache (der Cache legt Original-URLs ab; `next/image` hätte über seinen Optimierungs-Proxy andere URLs angefragt, die der Cache nie getroffen hätte). Der Trade-off: keine automatische Bildoptimierung, kein responsives `srcset`, keine automatische Lazy-Loading-Steuerung durch Next.js. Bei wachsendem Bildvolumen (viele hochauflösende Handyfotos pro Station) wird das relevant.
- Leaflet ist korrekt dynamisch mit `ssr: false` importiert (`src/components/tour-map.tsx`) – kein SSR-Overhead.

### 2.7 Mobile-First/Outdoor-Tauglichkeit

Nach der letzten Design-Überarbeitung (`SendaLore_Designregeln.md`) sind Tap-Ziele auf 44 px+ korrigiert, Farbkontrast von Copper/Tannengrün auf Creme statt zu blassen Zwischentönen. Kein expliziter Hochkontrast-/Sonnenlicht-Modus.

### 2.8 Accessibility

- **`<html lang="de">` ist in `src/app/layout.tsx:41` fest codiert**, unabhängig vom UI-Sprachschalter DE/EN (`src/lib/i18n/language-context.tsx`). Es gibt keinen Code, der `document.documentElement.lang` beim Sprachwechsel aktualisiert – ein WCAG-3.1.1-Verstoss: Bei englischer Ansicht bleibt das Sprachattribut „de".
- Mehrere `aria-label`s sind hartcodiert Deutsch statt über das i18n-System geführt (z. B. `src/components/tour-player.tsx:559`, `:582`: `"15 Sekunden zurück"`/`"15 Sekunden vor"`) – für EN-Nutzer mit Screenreader inkonsistent.

### 2.9 SEO/Metadaten

Nur `src/app/layout.tsx` (Root) und `src/app/(site)/touren/page.tsx` exportieren ein `metadata`-Objekt. **Die Tourdetailseite `src/app/(site)/touren/[slug]/page.tsx` hat kein `generateMetadata`.** Jeder geteilte Tour-Link (WhatsApp, Facebook, Google) zeigt Titel/Beschreibung der Startseite statt Tourname, -beschreibung und Coverbild. Für ein Produkt, das auf organische Weiterempfehlung und Auffindbarkeit einzelner Touren angewiesen ist, ist das ein direkter Reichweitenverlust – behebbar mit wenig Aufwand.

### 2.10 Fehlerbehandlung

Durchgängiges, robustes Muster: Fehlt eine Migration/Konfiguration, wird der betroffene Bereich ausgeblendet statt einen Fehler zu werfen (Quiz, Feedback, Medien – überall mit `try/catch` und Fallback). Gut für den aktuellen Stand. **Es gibt aber keine Fehler-Überwachung** (kein Sentry o. ä.) – Produktionsfehler (fehlgeschlagene Checkouts, defekte Audio-URLs) bleiben unsichtbar, bis sich jemand meldet.

### 2.11 Sicherheit

- RLS-Policies sind durchgängig vorhanden und folgen einem sauberen Muster (`status = 'published'` für Public-Read, `authenticated` für Admin-Write).
- Service-Role-Key wird korrekt nur serverseitig und nur im Stripe-Webhook verwendet (`src/lib/supabase/service.ts`).
- Stripe-Webhook-Signatur ist **selbst implementiert** via HMAC-SHA256 (`src/lib/payments/stripe.ts`, Funktion `verifyStripeSignature`) statt über das offizielle Stripe-SDK. Funktional korrekt, aber sicherheitskritischer Code (Signaturprüfung, Timing-Angriffsschutz) in Eigenbau ohne Security-Review ist ein Risikofaktor, den ein Solo-Entwickler bewusst trägt.
- **Kein Rate-Limiting** auf öffentlichen Schreib-Endpunkten: `submitFeedback` und `startCheckout` (`src/app/(site)/touren/[slug]/actions.ts`) sind ohne Auth und ohne Limit von jedem aufrufbar. Aktuell kein akutes Risiko bei geringem Traffic, aber trivial zu missbrauchen (Feedback-Spam, unnötige Stripe-API-Aufrufe), sobald die Seite bekannter wird.
- API-Key-Handling ist durchgängig sauber: Platzhalter-Pattern, korrekte Trennung `NEXT_PUBLIC_` (Thunderforest, bewusst clientseitig) vs. serverseitig (OpenRouteService, Stripe, DeepL, ElevenLabs, Supabase-Service-Role).

### 2.12 Phase-2-Status (laut Kontext geplant)

- **Stripe:** technisch vollständig umgesetzt (Checkout, Webhook, Paywall-UI), aber wie in 2.1 beschrieben nicht geräte-/account-übergreifend nutzbar.
- **PWA/Offline:** Manifest, App-Icons, Service Worker vorhanden – aber nur Teil-Offline (siehe 2.4). Für den zentralen Use-Case „Wandern ohne Netz" funktional unfertig, nicht nur ein Detail.

---

## 3. Wettbewerbsmatrix

| Anbieter | Erlösmodell | Content-Erstellung | Distribution | Zielgruppe | Offline/GPS | Onboarding-Reibung | UX Player/Katalog |
|---|---|---|---|---|---|---|---|
| **SmartGuide** | Free-CMS + kostenpflichtiger Redaktionsservice; neues Abo-Modell mit Rev-Share nach Nutzung [1][2] | DeepL-Übersetzung + automatische TTS „in einem Klick inkl. Audio"; TTS ab 60 €/h Phonembasis [1][3] | Eigene White-Label-App, 10 000+ Touren, 100 000+ POIs, 30 Sprachen [4] | B2B (Tour-Operators, Hop-on-Hop-off-Busse, White-Label) [5] | Vollständig offline, systemweit [4] | Niedrig für Self-Service, aber Marketing-Fokus auf Breite statt Kuratierung | Massenmarkt-Ästhetik, nicht kuratiert |
| **izi.TRAVEL** | Kostenlos für Creator; kaum Monetarisierung (Empfehlung 5–10 €, Grossteil gratis) [6][7] | Einfache Tools, Text/Audio/Bild/Video kombinierbar, unlimitierter Storage [6] | Eigene App + Web, „offizieller" Guide bei 3000+ Museen [7] | B2B (Museen) und B2C (Einzel-Autoren) gemischt | Ja (App) [7] | **Sehr niedrig**: 3 Schritte (erstellen → Testansicht → veröffentlichen) [6] | Funktional, Reichweite vor Ästhetik |
| **VoiceMap** | Rev-Share 50 % (Basic) bis 65 % (Premium) nach Zahlungsgebühren [8] | Redaktionelle Begleitung, automatische Wortzahl-/Sprechzeit-Schätzung aus Distanz + Fortbewegungsart, Schreibregel „<750 Wörter/5 Min pro Station" [9][10] | Eigene App + OTA (Viator/GetYourGuide, die selbst 20–30 % nehmen) nur auf Pro/Premium [8] | B2C-Einzel-Creator (Autoren/Journalisten) | Ja | Höher (redaktioneller Review-Prozess) – Qualität statt Instant-Publishing | Kuratiert, Marktplatz-Qualitätsversprechen |
| **STQRY/PocketSights** | Enterprise-Sales, keine öffentliche Preisliste gefunden | Web-Tour-Builder ohne Wegbeschränkung, Analytics | Eigene Marketplace-Option + White-Label | Klar B2B (Museen, DMOs, Bildungseinrichtungen) [11] | Ja | Enterprise-Onboarding (Sales-Prozess), nicht Self-Service | Institutionell, nicht Consumer-fokussiert |
| **Locatify** | Lizenz/Agentur-Modell, Creator-CMS + native White-Label-Apps | Proximity-Trigger, Push, Wayfinding, Quiz/Gamification, API, HTML-Templates [12] | White-Label native Apps | B2B/Agentur | Ja | Technisch mächtig, aber kein Self-Service-Massenmarkt | Flexibel, Scavenger-Hunt-Fokus |
| **Nubart** | Lizenz an Museen, „ohne App" wie SendaLore | Multimedia-Features (360°, 3D), DSGVO als Verkaufsargument [13] | Web-basiert, kein App-Zwang | B2B (Museen), nicht Outdoor | Ja | Institutionell | Kultur-/Museums-Ästhetik |
| **Hearonymus** | Kostenlose App, Plattform-/Distributionsmodell wie izi.TRAVEL [14] | Content-Produktion für Kultur/Tourismus | Eigene App, hostet viele Guides | B2B (Museen/Reiseregionen) | Ja | Niedrig | Ähnlich izi.TRAVEL |
| **TravelStorys** | Keine belastbaren aktuellen Daten gefunden – **Unsicherheit, nicht raten** | – | – | – | – | – | – |
| **Cya On The Road** | Pay-per-Tour, z. B. 14.99 $/Tour [15] | KI-gestützt: „AI turns your stories into audio guides" – automatisierte Story-Generierung, nicht nur TTS [15] | Eigene App | B2C-Einzel-Creator + Endkunden | Turn-by-turn-Directions via Partner, echte Offline-GPS-Qualität unklar [15] | Niedrig, KI-automatisiert | Modern, KI-first |
| **GPSmyCity** | 2–5 $/Tour, kostenlose Basisroute ohne Audio [16] | – (Endkunden-App, kein Creator-Fokus im Vordergrund) | Eigene App | B2C-Endkunden | Offline nur bei Kauf [16] | – | Preiswerter Einstieg |
| **Shaka Guide / GuideAlong (GyPSy)** | Einmalkauf ~20 $/Tour [17] | – | Eigene App, Fokus Autotouren (Hawaii, Nationalparks) | B2C-Endkunden | **100 % offline GPS inkl. Karten** [17] | – | Autotour, nicht Wandern |
| **Rick Steves Audio Europe** | Komplett kostenlos (Cross-Selling auf Bücher/Reisen) [18] | – | Eigene App, riesige Bibliothek | B2C-Endkunden, Europa-Reisende | Offline nach Download [18] | – | Kostenlos, hohe Reichweite |
| **Questo** | Pay-per-Tour, „kann teuer werden bei häufiger Nutzung" [19] | Gamifiziert: Rätsel statt reiner Narration | Eigene App, 600+ Städte | B2C-Endkunden | – | – | Spiel-Erlebnis, andere Kategorie |
| **Gamana** | „Unlimited access unter 30 $" (abo-artig) [19] | KI-personalisiert | Eigene App | B2C-Endkunden | – | – | Günstig vs. Privatguide positioniert |
| **Action Tour Guide** | Einmalkauf pro Tour | – | Eigene App, 200+ Touren USA/Mexiko/Europa/Island/Asien [19] | B2C-Endkunden | Ähnlich Shaka Guide | – | Autotour-fokussiert |
| **Outdooractive** (Aufmerksamkeitskonkurrenz) | Freemium/Abo | Community + Redaktion | Eigene App, starke Partnerschaften mit Tourismusdestinationen/Wanderverbänden, SwissTopo-Integration [20] | Wanderer (Planungsphase) | Premium-Tier offline | – | Routenplanung, nicht Storytelling |
| **Komoot** (Aufmerksamkeitskonkurrenz) | Freemium/Regionen-Kauf | Community-Routen | Marktführer DACH-Region [20] | Wanderer (Planungsphase) | Ja (Premium) | – | Routenplanung, kein Audio-Storytelling |
| **SchweizMobil** (Aufmerksamkeitskonkurrenz) | Kostenlos (öffentlich finanziert) | Offizielle Schweizer Wanderland-Daten | Eigene App | Schweizer Wanderer, hohe Vertrauensstellung | Unklar, keine belastbaren Zahlen gefunden | – | Amtlich, funktional |

---

## 4. Gap-Analyse

### 4.1 Feature-Gaps (fehlt schlicht)

- Echte Offline-Kartenkacheln (Abschnitt 2.4) – Shaka Guide/GyPSy haben das als Kernversprechen [17], SendaLore nicht.
- Individuelle Metadaten pro Tour (2.9) – jede andere hier analysierte Plattform mit eigener Tour-URL hat implizit teilbare, beschreibende Links.
- Kein Karten-Klick-Picker im Studio für Stationskoordinaten (2.5) – Locatify/STQRY bieten Kartenbau ohne manuelle Koordinaten-Eingabe [11][12].
- Kein Account-gebundener Kaufnachweis (2.1/2.12) – jede kommerzielle Konkurrenzlösung mit Login/Kauf hat das strukturell gelöst (App-Store-Kauf, Account-Login).
- Kein Rate-Limiting (2.11), kein Monitoring (2.10), keine Impressum/Datenschutz-Seite (2.2).

### 4.2 Qualitäts-Gaps (vorhanden, aber schlechter gelöst)

- GPS-Trigger ohne Hysterese und ohne Genauigkeitsanzeige (2.3) – VoiceMap kompensiert Unsicherheit mit einem „I am here"-Manual-Override *und* Vorschau der nächsten Station; SendaLore hat den Override (übernommen), aber keine Signalqualitäts-Rückmeldung.
- Audio-Preload nur für aktive Station, nicht antizipativ (2.3).
- Publishing-Flow ist funktional, aber pro Station ein wiederholtes Formular ohne Kartenbau (2.5) – bei izi.TRAVEL ist der Weg von Login zu veröffentlichter Tour laut eigenen Angaben auf 3 Schritte reduziert [6]; bei SendaLore sind es strukturell mehr, weil jede Station einzeln durchlaufen wird.

### 4.3 Positionierungs-Gaps (strategisch, nicht durch Code lösbar)

- **Discovery:** Wanderer recherchieren ihre Route in Komoot/Outdooractive/SchweizMobil, nicht in einer dedizierten Audioguide-App [20]. SendaLore hat keinen Kanal in diese Plattformen hinein (kein Eintrag, keine Verlinkung, keine Partnerschaft erkennbar).
- **Netzwerkeffekt fehlt:** izi.TRAVEL/VoiceMap/SmartGuide profitieren von Marktplatz-Traffic (Nutzer kommen wegen der Plattform, nicht wegen einer einzelnen Tour). SendaLore muss jeden Besucher selbst mitbringen.
- **Kein OTA-Vertrieb:** VoiceMap bindet Viator/GetYourGuide direkt an [8] – SendaLore hat keinen Vertriebskanal ausserhalb der eigenen Website.

---

## 5. Priorisierte Massnahmenliste

Sortiert nach Wirkung/Aufwand-Verhältnis, höchster Hebel zuerst.

| Massnahme | Wirkung | Aufwand | Phase | Begründung |
|---|---|---|---|---|
| `generateMetadata` pro Tour (Titel, Beschreibung, OG-Bild) | hoch | S | 1 | Jeder geteilte Link ist aktuell wertlos für Reichweite/SEO (2.9). Wenige Zeilen Code, sofortiger Effekt. |
| Impressum/Datenschutz/AGB-Seite | hoch | S | 1 | Rechtliche Grundvoraussetzung für Zahlungsabwicklung + E-Mail-Erfassung; fehlt komplett (2.2). |
| `lang`-Attribut dynamisch am Sprachschalter koppeln | mittel | S | 1 | WCAG-Verstoss und SEO-Verwässerung bei EN-Ansicht; eine `useEffect`-Zeile (2.8). |
| Rate-Limiting auf `submitFeedback`/`startCheckout` | mittel | S | 1 | Trivialer Missbrauch aktuell möglich; günstig zu schliessen, bevor Traffic wächst (2.11). |
| GPS-Genauigkeit anzeigen + einfache Hysterese (2 aufeinanderfolgende Fixes im Radius) | mittel | S | 1 | Senkt Frust bei schwachem Signal ohne grössere Umbauten; `coords.accuracy` liegt bereits in der API vor, wird nur nicht genutzt (2.3). |
| Audio-Preload der nächsten Station | mittel | S | 1–2 | Nutzt vorhandene `nextStation`-Logik; senkt Wartezeit beim Stationswechsel spürbar (2.3). |
| Kartenkacheln + Route-Antworten offline cachen | **hoch** | M | 2 | Schliesst die grösste funktionale Lücke im Kernszenario „Wandern ohne Netz" (2.4). Kein neues Feature, sondern Vervollständigung des bereits gebauten Offline-Modus. |
| Kauf serverseitig an E-Mail statt nur `localStorage` binden (z. B. Magic-Link zum Wiederherstellen) | hoch | M | 2 | Ohne das ist der Stripe-Checkout für Mehrgeräte-Nutzung faktisch kaputt; direktes Umsatzrisiko bei Support-Anfragen „ich habe schon bezahlt" (2.1/2.12). |
| Karten-Klick-Picker für Stationskoordinaten im Studio | hoch | M | 2 | Senkt die grösste konkrete Reibung im Publishing-Flow (2.5); wirkt sich direkt auf „Time-to-Market" pro Tour aus, was laut Kontext explizit priorisiert ist. |
| Fehler-Monitoring (z. B. Sentry Free-Tier) | mittel | S | 2 | Ohne das bleiben Produktionsfehler unsichtbar; günstig einzubauen, hoher Betriebsnutzen für eine Einzelperson ohne Support-Team (2.10). |
| Eigenes Stripe-Signatur-Handling durch offizielles SDK ersetzen oder extern reviewen lassen | mittel | S | 2 | Sicherheitskritischer Code in Eigenbau; Aufwand ist gering (SDK-Austausch), Risiko-Reduktion hoch (2.11). |
| Rollen-/Mandantenmodell (mehrere Personen, je eigene Touren) | hoch | L | 3 | Erst relevant, wenn tatsächlich eine zweite Institution/Person Zugriff braucht (Gemeinde, Naturpark). Vor einem echten B2B-Kunden nicht sinnvoll vorzubauen. |
| Distributions-/Partnerschafts-Anbindung (Outdooractive/Komoot-Verlinkung, QR-Codes vor Ort, Tourismusbüro-Kooperation) | hoch | L | 3 | Löst das grösste Problem (Discovery), ist aber keine Code-Aufgabe, sondern Geschäftsentwicklung – gehört trotzdem auf die Liste, weil sonst kein Feature etwas nützt. |
| Multi-Currency-Support | tief | S | 2–3 | Erst relevant bei internationalen Kunden; aktuell einzige Zielregion Schweiz/CHF. |

---

## 6. Differenzierung – die ehrliche Nische

Was SendaLore **nicht** kann, weil es strukturell fehlt: globale Reichweite/Netzwerkeffekt wie izi.TRAVEL oder VoiceMap, Skaleneffekte bei TTS/Übersetzung wie SmartGuide (100 000+ POIs, 30 Sprachen), redaktionelle Kapazität wie VoiceMap (die echte Redakteure beschäftigen), OTA-Anbindung, die Volumen voraussetzt.

Was SendaLore stattdessen hat und die grossen Plattformen strukturell nicht bieten können:

1. **Regionale Kuratierung statt globaler Marktplatz.** Bei izi.TRAVEL/VoiceMap ist eine Tour ein Listing unter Tausenden. Bei SendaLore ist die Plattform selbst das Produkt *für* Flims Laax Falera – kein Wettbewerb um Sichtbarkeit innerhalb der eigenen Seite.
2. **Genre-Vielfalt in einem Produkt.** SmartGuide/VoiceMap/STQRY sind primär klassische, faktenorientierte Stadt-/Museumsführungen. Die Positionierung „Geschichten für Kinder, Paare, Sagen, Schulklassen" in einem kohärenten Markenauftritt ist eine Nische, die generische Infrastruktur-Plattformen nicht redaktionell bedienen – sie sind Werkzeuge für beliebigen Content, nicht kuratierte Marken.
3. **Keine Provisions-/Plattformabhängigkeit.** Bei VoiceMap gehen 35–50 % an die Plattform, bei OTA-Vertrieb zusätzlich 20–30 % an Viator/GetYourGuide [8]. SendaLore gehört Matt zu 100 %, direkte Kundenbeziehung, eigenes Branding – verkaufbar als eigenständiges White-Label-artiges Produkt an eine Destination, ohne dass die Destination Konkurrenz-Content auf derselben Plattform sieht.

---

## 7. Risiken (inkl. der unbequemen)

- **„Warum zahlen, wenn izi.TRAVEL/Rick Steves gratis publizieren?"** Ehrliche Antwort: Das Risiko ist kleiner, wenn es für Flims Laax Falera noch keine nennenswerten Einträge auf izi.TRAVEL/GPSmyCity gibt – das habe ich **nicht recherchiert** und sollte vor der nächsten Preisentscheidung geprüft werden, statt es anzunehmen.
- **Discovery-Problem bleibt ungelöst.** Wanderer suchen in Komoot/Outdooractive/SchweizMobil nach einer Route, nicht in einer Audioguide-App [20]. Ohne einen Kanal dorthin (QR-Code vor Ort, Partnerschaft mit Tourismusbüro, Eintrag/Verlinkung auf den grossen Plattformen) bleibt SendaLore auf mitgebrachten Traffic angewiesen – kein Feature der Liste oben löst das.
- **Solo-Entwickler-Sicherheitsrisiko.** Sicherheitskritischer Code (Stripe-Signaturprüfung, RLS-Policies) ohne Peer-Review oder externes Audit; kleine Fehlerwahrscheinlichkeit, aber hohe Konsequenz (Zahlungsbetrug, Datenleck) bei einer Person ohne dedizierte Sicherheitsprüfung.
- **Kein Betriebs-Monitoring.** Fehler in Produktion (fehlgeschlagene Zahlungen, defekte Audiodateien) bleiben unsichtbar, bis sich ein Nutzer meldet – bei einem nebenberuflichen Ein-Personen-Betrieb ohne Kapazität für ständige manuelle Kontrolle ein reales Betriebsrisiko.
- **Rechtliche Lücke.** Fehlende Impressum-/Datenschutzseite trotz Zahlungsabwicklung und E-Mail-Erfassung – kein anwaltlicher Rat, aber ein klarer Fakt, der vor öffentlichem Launch zu klären ist.

---

## 8. Quellen

[1] [How to translate an entire digital tour guide in one click including the audio – SmartGuide Blog](https://blog.smart-guide.org/en/translate-an-entire-digital-tour-guide-in-one-click-including-the-audio)
[2] [SmartGuide introduces a brand-new subscription model for users](https://blog.smart-guide.org/en/smartguide-introduces-a-brand-new-subscription-model-for-users)
[3] [Digital audio guides and the effectiveness of deep learning in travel content translation](https://blog.smart-guide.org/en/digital-audio-guides-and-the-effectiveness-of-deep-learning)
[4] [FAQ | SmartGuide](https://www.smartguide.app/faq)
[5] [Digital audio guide for tour operators | SmartGuide](https://www.smartguide.app/tour-operators)
[6] [Delight your visitors with immersive content | IZI Travel](https://izi.travel/en/create/professionals)
[7] [I want to use izi.TRAVEL service. Is it free? – izi.TRAVEL Support](https://izitravel.uservoice.com/knowledgebase/articles/376794-i-want-to-use-izi-travel-service-is-it-free)
[8] [Audio Tour Publishing Plans and Pricing » VoiceMap](https://voicemap.me/pricing)
[9] [How are my earnings from tour sales calculated? | VoiceMap Tour Publisher Documentation](https://docs.voicemap.me/tour-publishers/tour-payment-calculations/)
[10] [Word counts » VoiceMap Tour Publisher Documentation](https://docs.voicemap.me/tour-publishers/word-counts/)
[11] [STQRY | Build Self-Guided Tours and Interactive Experiences](https://www.stqry.com/)
[12] [Locatify Products & Services – Audio Guides & Scavenger Hunts](https://locatify.com/products-and-services/)
[13] [Museum Audio Guide System Without Devices or Apps | Nubart GUIDE](https://www.nubart.eu/audio-guides/)
[14] [Audio guide system & platform app for smartphones | Hearonymus](https://www.hearonymus.com/en/)
[15] [Cya On The Road: AI-Powered Audio Tour App & Platform](https://www.cyaontheroad.com/)
[16] [Best Self-Guided Tour Apps for Travelers (2026): An Honest Comparison](https://tourinabox.com/blog/best-self-guided-tour-apps/)
[17] [Shaka Guide vs Guide Along (formerly GyPSy Guide)](https://www.shakaguide.com/article/planyourtrip/shaka-guide-vs-gypsy-guide)
[18] [Rick Steves Audio Europe Travel App](https://www.ricksteves.com/watch-read-listen/audio/audio-europe)
[19] [5 Best Tour Guide Apps for Travelers: GPS Audio, Offline Maps & Smart Walking Tours | Gamana Blog](https://www.gamana.app/blog/best-tour-guide-apps-for-travelers)
[20] [Hiking Apps Market Size, Share, and Industry Trends Forecast 2026-2036 | MarkWide Research](https://markwideresearch.com/hiking-apps-market)

**Nicht ausreichend recherchierbar (explizit offen, statt geraten):** Konkrete, aktuelle Nutzerzahlen für SchweizMobil; belastbare aktuelle Produktdaten zu TravelStorys als eigenständigem Anbieter; ob für Flims Laax Falera bereits Inhalte auf izi.TRAVEL/GPSmyCity existieren.
