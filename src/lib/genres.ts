// Erlebnis-Genres (design-system/MASTER.md §2.2): jedes Genre besetzt
// einen Farbton des Twilight-Himmels.

export const GENRES = {
  wissen: {
    label: "Wissen & Natur",
    badgeClass: "bg-primary/10 text-primary border-primary/30",
    lineClass: "bg-primary",
  },
  kinder: {
    label: "Kindergeschichte",
    badgeClass: "bg-mist/10 text-mist border-mist/30",
    lineClass: "bg-mist",
  },
  romantik: {
    label: "Romantischer Rundgang",
    badgeClass: "bg-dusk/10 text-dusk border-dusk/30",
    lineClass: "bg-dusk",
  },
  sagen: {
    label: "Sagen & Mystik",
    badgeClass: "bg-twilight/10 text-twilight border-twilight/30",
    lineClass: "bg-twilight",
  },
  schule: {
    label: "Schule & Exkursion",
    badgeClass: "bg-secondary/10 text-foreground border-border",
    lineClass: "bg-secondary",
  },
} as const;

export type Genre = keyof typeof GENRES;

export function isGenre(value: unknown): value is Genre {
  return typeof value === "string" && value in GENRES;
}

export const GENRE_KEYS = Object.keys(GENRES) as Genre[];
