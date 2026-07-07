import { isGenre } from "@/lib/genres";

export type ParsedStation = {
  title: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  transcript: string | null;
  audio_url: string | null;
};

export type ParsedTour = {
  title: string;
  region: string | null;
  duration_minutes: number | null;
  difficulty: string | null;
  genre: string | null;
  stations: ParsedStation[];
};

export type ParseResult = {
  tours: ParsedTour[];
  warnings: string[];
};

// Spalten-Aliase (klein geschrieben, ohne Rand-Leerzeichen).
const ALIASES: Record<string, string[]> = {
  tourTitle: ["tour", "tour_title", "tourtitel", "tour titel", "tourname", "tour name"],
  region: ["region", "ort", "gebiet"],
  duration: ["dauer", "duration", "dauer (min)", "dauer min", "minuten", "duration_minutes"],
  difficulty: ["schwierigkeit", "difficulty", "level"],
  genre: ["genre", "typ", "kategorie"],
  stationTitle: ["station", "station_title", "stationstitel", "station titel", "stationtitel"],
  description: ["beschreibung", "description", "beschrieb", "kurztext"],
  latitude: ["lat", "latitude", "breitengrad", "breite"],
  longitude: ["lon", "lng", "long", "longitude", "laengengrad", "längengrad", "laenge", "länge"],
  transcript: ["transkript", "transcript", "audiotext", "skript", "text", "erzähltext", "erzaehltext"],
  audio: ["audio", "audio_url", "audiolink", "audio link", "audiodatei"],
};

const GENRE_ALIASES: Record<string, string> = {
  wissen: "wissen",
  "wissen & natur": "wissen",
  natur: "wissen",
  kinder: "kinder",
  kindergeschichte: "kinder",
  romantik: "romantik",
  "romantischer rundgang": "romantik",
  sagen: "sagen",
  "sagen & mystik": "sagen",
  mystik: "sagen",
  schule: "schule",
  "schule & exkursion": "schule",
  exkursion: "schule",
};

function buildHeaderMap(headers: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const header of headers) {
    const norm = header.trim().toLowerCase();
    for (const [canonical, aliases] of Object.entries(ALIASES)) {
      if (aliases.includes(norm)) {
        map.set(canonical, header);
        break;
      }
    }
  }
  return map;
}

function str(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s === "" ? null : s;
}

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n =
    typeof value === "number"
      ? value
      : Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function normalizeGenre(value: string | null): string | null {
  if (!value) return null;
  const mapped = GENRE_ALIASES[value.trim().toLowerCase()];
  if (mapped) return mapped;
  return isGenre(value) ? value : null;
}

/**
 * Nimmt Zeilen (aus XLSX.utils.sheet_to_json) und gruppiert sie nach
 * Tour-Titel zu Touren mit Stationen. Eine Zeile = eine Station.
 */
export function parseRows(rows: Record<string, unknown>[]): ParseResult {
  const warnings: string[] = [];
  if (rows.length === 0) {
    return { tours: [], warnings: ["Die Datei enthält keine Zeilen."] };
  }

  const headerMap = buildHeaderMap(Object.keys(rows[0]));
  if (!headerMap.has("tourTitle")) {
    warnings.push(
      "Keine Tour-Spalte erkannt (erwartet z. B. „Tour“ oder „Tourtitel“).",
    );
  }
  if (!headerMap.has("stationTitle")) {
    warnings.push(
      "Keine Stations-Spalte erkannt (erwartet z. B. „Station“).",
    );
  }

  const get = (row: Record<string, unknown>, key: string) => {
    const col = headerMap.get(key);
    return col ? row[col] : undefined;
  };

  const byTour = new Map<string, ParsedTour>();
  let lastTourTitle: string | null = null;

  rows.forEach((row, i) => {
    // Tour-Titel darf leer bleiben, wenn Folgezeile zur selben Tour gehört.
    const tourTitle = str(get(row, "tourTitle")) ?? lastTourTitle;
    if (!tourTitle) {
      warnings.push(`Zeile ${i + 2}: ohne Tour-Titel – übersprungen.`);
      return;
    }
    lastTourTitle = tourTitle;

    let tour = byTour.get(tourTitle);
    if (!tour) {
      tour = {
        title: tourTitle,
        region: str(get(row, "region")),
        duration_minutes: num(get(row, "duration")),
        difficulty: str(get(row, "difficulty")),
        genre: normalizeGenre(str(get(row, "genre"))),
        stations: [],
      };
      byTour.set(tourTitle, tour);
    }

    const stationTitle = str(get(row, "stationTitle"));
    if (!stationTitle) return; // Zeile nur mit Tour-Metadaten

    const lat = num(get(row, "latitude"));
    const lon = num(get(row, "longitude"));
    if (lat === null || lon === null) {
      warnings.push(
        `Zeile ${i + 2} („${stationTitle}“): Koordinaten fehlen oder ungültig.`,
      );
    }

    tour.stations.push({
      title: stationTitle,
      description: str(get(row, "description")),
      latitude: lat,
      longitude: lon,
      transcript: str(get(row, "transcript")),
      audio_url: str(get(row, "audio")),
    });
  });

  return { tours: [...byTour.values()], warnings };
}
