"use client";

import { useRef, useState } from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { importTours } from "@/app/studio/actions";
import { Button } from "@/components/ui/button";
import { parseRows, type ParseResult } from "@/lib/import/parse";
import { GENRES, GENRE_KEYS } from "@/lib/genres";

export function TourImport() {
  const [result, setResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    setFileName(file.name);
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });
      setResult(parseRows(rows));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Datei konnte nicht gelesen werden.");
    }
  }

  async function downloadTemplate() {
    const XLSX = await import("xlsx");
    const rows = [
      {
        Tour: "Segnes – Stargels",
        Region: "Flims / Laax",
        Dauer: 120,
        Schwierigkeit: "Mittel",
        Genre: "wissen",
        Station: "Start am Segnesboden",
        Beschreibung: "Auftakt der Tour.",
        Lat: 46.8887,
        Lon: 9.2313,
        Transkript: "Willkommen auf dem Panoramaweg …",
        Audio: "",
      },
      {
        Tour: "",
        Region: "",
        Dauer: "",
        Schwierigkeit: "",
        Genre: "",
        Station: "Die Tektonikarena",
        Beschreibung: "Zweite Station.",
        Lat: 46.891,
        Lon: 9.238,
        Transkript: "Warum liegt altes Gestein über jungem? …",
        Audio: "",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Touren");
    XLSX.writeFile(wb, "digititeacher-vorlage.xlsx");
  }

  const totalStations =
    result?.tours.reduce((sum, t) => sum + t.stations.length, 0) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-dashed p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload aria-hidden="true" />
            Excel-Datei wählen
          </Button>
          <Button type="button" variant="outline" onClick={downloadTemplate}>
            <Download aria-hidden="true" />
            Vorlage herunterladen
          </Button>
          {fileName && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <FileSpreadsheet aria-hidden="true" className="size-4" />
              {fileName}
            </span>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Eine Zeile pro Station. Erkannte Spalten: Tour, Region, Dauer,
          Schwierigkeit, Genre, Station, Beschreibung, Lat, Lon, Transkript,
          Audio. Tour-Spalten dürfen bei Folgestationen leer bleiben.
          Genres: {GENRE_KEYS.map((k) => GENRES[k].label).join(", ")}.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <div className="flex flex-col gap-4">
          <p className="text-sm">
            <span className="font-medium">{result.tours.length}</span>{" "}
            {result.tours.length === 1 ? "Tour" : "Touren"} mit{" "}
            <span className="font-medium">{totalStations}</span> Stationen
            erkannt.
          </p>

          {result.warnings.length > 0 && (
            <ul className="rounded-lg border border-primary/40 bg-primary/5 p-4 text-xs text-muted-foreground">
              {result.warnings.slice(0, 12).map((w, i) => (
                <li key={i}>• {w}</li>
              ))}
              {result.warnings.length > 12 && (
                <li>• … und {result.warnings.length - 12} weitere.</li>
              )}
            </ul>
          )}

          <div className="flex flex-col gap-3">
            {result.tours.map((tour, i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{tour.title}</p>
                  <span className="text-xs text-muted-foreground">
                    {tour.genre ? `${tour.genre} · ` : ""}
                    {tour.stations.length} Stationen
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[tour.region, tour.difficulty, tour.duration_minutes && `${tour.duration_minutes} min`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            ))}
          </div>

          {result.tours.length > 0 && (
            <form action={importTours}>
              <input
                type="hidden"
                name="payload"
                value={JSON.stringify(result.tours)}
              />
              <Button type="submit">
                {result.tours.length}{" "}
                {result.tours.length === 1 ? "Tour" : "Touren"} als Entwurf
                importieren
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Touren werden als Entwurf angelegt – prüfen und im Studio
                veröffentlichen.
              </p>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
