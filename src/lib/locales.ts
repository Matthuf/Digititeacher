// Deutsch ist die Basissprache (liegt direkt in tours/stations).
// Übersetzungen liegen in tour_translations/station_translations.

export const BASE_LOCALE = "de" as const;

export const TRANSLATION_LOCALES = {
  en: "English",
  it: "Italiano",
  fr: "Français",
  rm: "Rumantsch",
} as const;

export type TranslationLocale = keyof typeof TRANSLATION_LOCALES;
export type Locale = typeof BASE_LOCALE | TranslationLocale;

export const LOCALE_LABELS: Record<Locale, string> = {
  de: "Deutsch",
  ...TRANSLATION_LOCALES,
};

export function isTranslationLocale(
  value: unknown,
): value is TranslationLocale {
  return typeof value === "string" && value in TRANSLATION_LOCALES;
}

export const TRANSLATION_LOCALE_KEYS = Object.keys(
  TRANSLATION_LOCALES,
) as TranslationLocale[];
