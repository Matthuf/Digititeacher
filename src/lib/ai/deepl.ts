// DeepL-Anbindung. Unterstützte Zielsprachen der Plattform: EN, IT, FR.
// Rumantsch (rm) wird von DeepL NICHT unterstützt.

const DEEPL_TARGETS: Record<string, string> = {
  en: "EN",
  it: "IT",
  fr: "FR",
};

export function deeplSupports(locale: string): boolean {
  return locale in DEEPL_TARGETS;
}

export function deeplConfigured(): boolean {
  return !!process.env.DEEPL_API_KEY;
}

/**
 * Übersetzt eine Liste von Texten ins Ziel-Locale. Leere Einträge bleiben
 * leer. Reihenfolge entspricht der Eingabe.
 */
export async function deeplTranslate(
  texts: string[],
  locale: string,
): Promise<string[]> {
  const key = process.env.DEEPL_API_KEY;
  if (!key) throw new Error("DEEPL_API_KEY ist nicht gesetzt.");

  const target = DEEPL_TARGETS[locale];
  if (!target) throw new Error(`DeepL unterstützt die Sprache "${locale}" nicht.`);

  // Nur nicht-leere Texte senden, Positionen merken.
  const indices: number[] = [];
  const payload: string[] = [];
  texts.forEach((t, i) => {
    if (t && t.trim()) {
      indices.push(i);
      payload.push(t);
    }
  });
  if (payload.length === 0) return texts.map(() => "");

  const endpoint = key.endsWith(":fx")
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";

  const body = new URLSearchParams();
  body.set("target_lang", target);
  body.set("source_lang", "DE");
  for (const t of payload) body.append("text", t);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`DeepL-Fehler (${res.status}): ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    translations: { text: string }[];
  };

  const result = texts.map(() => "");
  data.translations.forEach((tr, i) => {
    result[indices[i]] = tr.text;
  });
  return result;
}
