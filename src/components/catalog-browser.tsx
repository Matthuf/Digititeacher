"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, Map as MapIcon, Search } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { TourCard } from "@/components/tour-card";
import { ToursOverviewMap, type TourPin } from "@/components/tours-overview-map";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GENRE_KEYS, GENRES, isGenre } from "@/lib/genres";
import { useLanguage } from "@/lib/i18n/language-context";
import type { Tour } from "@/lib/tours";

type TourWithPin = Tour & { mapPosition: { lat: number; lng: number } | null };

export function CatalogBrowser({ tours }: { tours: TourWithPin[] }) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState<string>("all");
  const [region, setRegion] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [view, setView] = useState<"list" | "map">("list");

  const regions = useMemo(
    () => [...new Set(tours.map((t) => t.region).filter(Boolean))] as string[],
    [tours],
  );
  const difficulties = useMemo(
    () => [...new Set(tours.map((t) => t.difficulty).filter(Boolean))] as string[],
    [tours],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tours.filter((tour) => {
      if (genre !== "all" && tour.genre !== genre) return false;
      if (region !== "all" && tour.region !== region) return false;
      if (difficulty !== "all" && tour.difficulty !== difficulty) return false;
      if (q) {
        const haystack = `${tour.title} ${tour.description ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [tours, search, genre, region, difficulty]);

  const hasActiveFilters =
    search !== "" || genre !== "all" || region !== "all" || difficulty !== "all";

  function resetFilters() {
    setSearch("");
    setGenre("all");
    setRegion("all");
    setDifficulty("all");
  }

  const groups = useMemo(() => {
    const withGenre = GENRE_KEYS.map((key) => ({
      key,
      label: GENRES[key].label,
      tours: filtered.filter((tr) => tr.genre === key),
    })).filter((g) => g.tours.length > 0);
    const rest = filtered.filter((tr) => !isGenre(tr.genre));
    return { withGenre, rest };
  }, [filtered]);

  const mapPins: TourPin[] = filtered
    .filter((tr) => tr.mapPosition)
    .map((tr) => ({
      id: tr.id,
      title: tr.title,
      slug: tr.slug,
      genre: tr.genre ?? null,
      latitude: tr.mapPosition!.lat,
      longitude: tr.mapPosition!.lng,
    }));

  return (
    <div>
      {/* Filter bar */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 sm:min-w-[220px]">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("catalog.filter.search")}
            className="pl-9"
          />
        </div>

        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          aria-label={t("catalog.filter.genre")}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">{t("catalog.filter.genre")}: {t("catalog.filter.all")}</option>
          {GENRE_KEYS.map((key) => (
            <option key={key} value={key}>
              {GENRES[key].label}
            </option>
          ))}
        </select>

        {regions.length > 1 && (
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            aria-label={t("catalog.filter.region")}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">{t("catalog.filter.region")}: {t("catalog.filter.all")}</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        )}

        {difficulties.length > 1 && (
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            aria-label={t("catalog.filter.difficulty")}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">
              {t("catalog.filter.difficulty")}: {t("catalog.filter.all")}
            </option>
            {difficulties.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}

        <div className="ml-auto flex items-center gap-1 rounded-full border p-1">
          <button
            type="button"
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              view === "list"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid aria-hidden="true" className="size-3.5" />
            {t("catalog.view.list")}
          </button>
          <button
            type="button"
            onClick={() => setView("map")}
            aria-pressed={view === "map"}
            disabled={mapPins.length === 0}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
              view === "map"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MapIcon aria-hidden="true" className="size-3.5" />
            {t("catalog.view.map")}
          </button>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {t("catalog.filter.noResults")}
          </p>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={resetFilters}
            >
              {t("catalog.filter.reset")}
            </Button>
          )}
        </div>
      )}

      {filtered.length > 0 && view === "map" && (
        <div className="mt-8 overflow-hidden rounded-2xl border">
          <ToursOverviewMap tours={mapPins} className="h-96 w-full sm:h-[28rem]" />
        </div>
      )}

      {filtered.length > 0 && view === "list" && (
        <>
          {groups.withGenre.length > 0 ? (
            <div className="mt-8 flex flex-col gap-14">
              {groups.withGenre.map((group) => (
                <div key={group.key}>
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className={`h-6 w-1 rounded-full ${GENRES[group.key as keyof typeof GENRES].lineClass}`}
                    />
                    <h3 className="font-serif text-xl font-semibold tracking-tight">
                      {group.label}
                    </h3>
                  </div>
                  <div className="mt-5 grid gap-6 sm:grid-cols-2">
                    {group.tours.map((tour, i) => (
                      <Reveal key={tour.id} delay={Math.min(i * 0.07, 0.35)} className="h-full">
                        <TourCard tour={tour} />
                      </Reveal>
                    ))}
                  </div>
                </div>
              ))}
              {groups.rest.length > 0 && (
                <div>
                  <h3 className="font-serif text-xl font-semibold tracking-tight">
                    {t("catalog.other")}
                  </h3>
                  <div className="mt-5 grid gap-6 sm:grid-cols-2">
                    {groups.rest.map((tour, i) => (
                      <Reveal key={tour.id} delay={Math.min(i * 0.07, 0.35)} className="h-full">
                        <TourCard tour={tour} />
                      </Reveal>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {filtered.map((tour, i) => (
                <Reveal key={tour.id} delay={Math.min(i * 0.07, 0.35)} className="h-full">
                  <TourCard tour={tour} />
                </Reveal>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
