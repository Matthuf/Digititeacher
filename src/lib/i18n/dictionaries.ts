// UI-Wörterbuch für die öffentlichen Seiten (nicht die Tour-Inhalte —
// die haben ihr eigenes Übersetzungssystem in lib/tours.ts + lib/locales.ts).
// Das Studio bleibt bewusst deutsch (Admin-Werkzeug, nicht öffentlich).

export const UI_LOCALES = { de: "Deutsch", en: "English" } as const;
export type UiLocale = keyof typeof UI_LOCALES;
export const DEFAULT_UI_LOCALE: UiLocale = "de";

export function isUiLocale(value: unknown): value is UiLocale {
  return value === "de" || value === "en";
}

type Dict = Record<string, string>;

export const dictionaries: Record<UiLocale, Dict> = {
  de: {
    "nav.tours": "Touren",
    "nav.studio": "Studio",
    "hero.eyebrow": "GPS-Audiotouren zum Erleben",
    "hero.titleMain": "Geschichten, die deinen Weg",
    "hero.titleAccent": "begleiten",
    "hero.subtitle":
      "Geschichten für Kinder, Wissen über Natur und Kultur, Rundgänge zu zweit – erzählt genau dort, wo du gerade stehst. Direkt im Browser.",
    "hero.cta": "Touren entdecken",
    "features.autoplay.title": "GPS-Autoplay",
    "features.autoplay.text":
      "Die Erzählung startet automatisch, sobald du eine Station erreichst.",
    "features.noapp.title": "Keine App nötig",
    "features.noapp.text":
      "Alles läuft direkt im Browser – Link öffnen und loswandern.",
    "features.handmade.title": "Von Hand gemacht",
    "features.handmade.text":
      "Jede Tour ist recherchiert, geschrieben und selbst vertont.",
    "catalog.title": "Alle Touren",
    "catalog.count.one": "Tour online",
    "catalog.count.other": "Touren online",
    "catalog.notConfigured":
      "Supabase ist noch nicht konfiguriert. Sobald das Projekt verbunden ist, erscheinen hier die veröffentlichten Touren.",
    "catalog.loadError":
      "Die Touren können gerade nicht geladen werden. Bitte versuche es in ein paar Minuten noch einmal.",
    "catalog.empty.before": "Noch keine Touren veröffentlicht. Die erste entsteht gerade im",
    "catalog.empty.studio": "Studio",
    "catalog.other": "Weitere Touren",
    "catalog.filter.all": "Alle",
    "catalog.filter.genre": "Genre",
    "catalog.filter.region": "Region",
    "catalog.filter.difficulty": "Schwierigkeit",
    "catalog.filter.search": "Touren durchsuchen …",
    "catalog.filter.noResults": "Keine Touren gefunden. Filter zurücksetzen?",
    "catalog.filter.reset": "Filter zurücksetzen",
    "catalog.view.list": "Liste",
    "catalog.view.map": "Karte",
    "tour.back": "Alle Touren",
    "tour.minutes": "Minuten",
    "tour.languageAria": "Sprache wählen",
    "tour.loadError.title": "Tour kann gerade nicht geladen werden",
    "tour.loadError.text": "Bitte versuche es in ein paar Minuten noch einmal.",
    "footer.tagline": "Geschichten, die deinen Weg begleiten.",
    "footer.studio": "Studio",
    "player.autoplay.title": "GPS-Autoplay",
    "player.autoplay.text":
      "Startet das Audio automatisch, sobald du eine Station erreichst.",
    "player.autoplay.on": "Aktiv – ausschalten",
    "player.autoplay.off": "Aktivieren",
    "player.of": "von",
    "player.progress": "Stationen gehört",
    "player.noAudio": "Kein Audio hinterlegt.",
    "player.transcriptShow": "Text anzeigen",
    "player.transcriptHide": "Text ausblenden",
    "feedback.title": "Bewertungen",
    "feedback.ratingLabel": "Wie hat dir die Tour gefallen?",
    "feedback.commentPlaceholder": "Möchtest du uns noch etwas mitteilen? (optional)",
    "feedback.submit": "Bewertung abschicken",
    "feedback.thanks": "Danke für dein Feedback!",
    "feedback.count.one": "Bewertung",
    "feedback.count.other": "Bewertungen",
  },
  en: {
    "nav.tours": "Tours",
    "nav.studio": "Studio",
    "hero.eyebrow": "GPS audio tours to experience",
    "hero.titleMain": "Stories that",
    "hero.titleAccent": "walk with you",
    "hero.subtitle":
      "Stories for kids, knowledge about nature and culture, walks for two — told exactly where you're standing. Right in your browser.",
    "hero.cta": "Discover tours",
    "features.autoplay.title": "GPS autoplay",
    "features.autoplay.text":
      "The narration starts automatically as soon as you reach a station.",
    "features.noapp.title": "No app needed",
    "features.noapp.text": "Everything runs in the browser — open the link and go.",
    "features.handmade.title": "Handmade",
    "features.handmade.text":
      "Every tour is researched, written and narrated by hand.",
    "catalog.title": "All tours",
    "catalog.count.one": "tour online",
    "catalog.count.other": "tours online",
    "catalog.notConfigured":
      "Supabase isn't configured yet. Published tours will appear here once the project is connected.",
    "catalog.loadError":
      "Tours can't be loaded right now. Please try again in a few minutes.",
    "catalog.empty.before": "No tours published yet. The first one is being built in the",
    "catalog.empty.studio": "studio",
    "catalog.other": "More tours",
    "catalog.filter.all": "All",
    "catalog.filter.genre": "Genre",
    "catalog.filter.region": "Region",
    "catalog.filter.difficulty": "Difficulty",
    "catalog.filter.search": "Search tours …",
    "catalog.filter.noResults": "No tours found. Reset filters?",
    "catalog.filter.reset": "Reset filters",
    "catalog.view.list": "List",
    "catalog.view.map": "Map",
    "tour.back": "All tours",
    "tour.minutes": "minutes",
    "tour.languageAria": "Choose language",
    "tour.loadError.title": "This tour can't be loaded right now",
    "tour.loadError.text": "Please try again in a few minutes.",
    "footer.tagline": "Stories that walk with you.",
    "footer.studio": "Studio",
    "player.autoplay.title": "GPS autoplay",
    "player.autoplay.text":
      "Starts the audio automatically as soon as you reach a station.",
    "player.autoplay.on": "Active – turn off",
    "player.autoplay.off": "Enable",
    "player.of": "of",
    "player.progress": "stations heard",
    "player.noAudio": "No audio available.",
    "player.transcriptShow": "Show text",
    "player.transcriptHide": "Hide text",
    "feedback.title": "Reviews",
    "feedback.ratingLabel": "How did you like the tour?",
    "feedback.commentPlaceholder": "Anything else you'd like to share? (optional)",
    "feedback.submit": "Submit review",
    "feedback.thanks": "Thanks for your feedback!",
    "feedback.count.one": "review",
    "feedback.count.other": "reviews",
  },
};
