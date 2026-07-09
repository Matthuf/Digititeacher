// Erlebnis-Genres (SendaLore_Designregeln.md §Kategorien): jedes Genre
// besetzt eine der fünf definierten Kategorie-Farben.

export const GENRES = {
  wissen: {
    label: "Wissen & Natur",
    badgeClass: "bg-cat-nature/10 text-cat-nature border-cat-nature/30",
    lineClass: "bg-cat-nature",
    colorVar: "var(--cat-nature)",
  },
  kinder: {
    label: "Kindergeschichte",
    badgeClass: "bg-cat-children/10 text-cat-children border-cat-children/30",
    lineClass: "bg-cat-children",
    colorVar: "var(--cat-children)",
  },
  romantik: {
    label: "Rundgang zu zweit",
    badgeClass: "bg-cat-couple/10 text-cat-couple border-cat-couple/30",
    lineClass: "bg-cat-couple",
    colorVar: "var(--cat-couple)",
  },
  sagen: {
    label: "Sagen & Mythen",
    badgeClass: "bg-cat-history/10 text-cat-history border-cat-history/30",
    lineClass: "bg-cat-history",
    colorVar: "var(--cat-history)",
  },
  schule: {
    // Kein eigenes Farbpaar in den Designregeln definiert; nutzt den
    // ruhigen "Kultur & Geschichte"-Ton (ged. Violett/Braun) als Basis.
    label: "Schule & Exkursion",
    badgeClass: "bg-cat-culture/10 text-cat-culture border-cat-culture/30",
    lineClass: "bg-cat-culture",
    colorVar: "var(--cat-culture)",
  },
} as const;

export type Genre = keyof typeof GENRES;

export function isGenre(value: unknown): value is Genre {
  return typeof value === "string" && value in GENRES;
}

export const GENRE_KEYS = Object.keys(GENRES) as Genre[];
