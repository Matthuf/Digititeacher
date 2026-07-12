"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, Map as MapIcon, Search } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { TourCard } from "@/components/tour-card";
import { FilterChip } from "@/components/ui/filter-chip";
import { ToursOverviewMap, type TourPin } from "@/components/tours-overview-map";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GENRE_KEYS, GENRES, isGenre } from "@/lib/genres";
import { useLanguage } from "@/lib/i18n/language-context";
import type { Tour } from "@/lib/tours";

type TourWithPin = Tour & { mapPosition: { lat: number; lng: number } | null };

const SEARCH_DEBOUNCE_MS = 400;

export function CatalogBrowser({ tours }: { tours: TourWithPin[] }) {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Diskrete Filter (Chips, Selects, Ansicht) leben direkt in der URL – kein
  // separater React-State, der aus der Sync geraten könnte. Browser-Zurück
  // funktioniert dadurch automatisch.
  const genre = searchParams.get("genre") ?? "all";
  const region = searchParams.get("region") ?? "all";
  const difficulty = searchParams.get("difficulty") ?? "all";
  const view = searchParams.get("view") === "map" ? "map" : "list";

  // Freitextsuche: lokaler State für sofortiges Feedback beim Tippen, mit
  // debounced Sync in die URL (kein History-Eintrag pro Tastenanschlag).
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const urlValue = searchParams.get("q") ?? "";
    const timer = setTimeout(() => {
      setSearch((current) => (current === urlValue ? current : urlValue));
    }, 0);
    // Nur auf externe Navigation reagieren (z. B. Zurück-Button); die
    // debounced Schreibrichtung unten löst dasselbe Update aus, das hier
    // dann als No-Op landet.
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("q")]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const current = searchParams.get("q") ?? "";
      if (search === current) return;
      const params = new URLSearchParams(searchParams.toString());
      if (search.trim()) params.set("q", search);
      else params.delete("q");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "") params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function resetFilters() {
    setSearch("");
    router.push(pathname, { scroll: false });
  }

  const regions = useMemo(
    () => [...new Set(tours.map((tr) => tr.region).filter(Boolean))] as string[],
    [tours],
  );
  const difficulties = useMemo(
    () => [...new Set(tours.map((tr) => tr.difficulty).filter(Boolean))] as string[],
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

  // Bei wenigen Touren wirkt eine volle Such-/Filterleiste leer und
  // überdimensioniert (Designregeln.md §Tourenübersicht) – dann reicht die
  // kuratierte Liste.
  const showFilterBar = tours.length > 4;

  return (
    <div>
      {/* Filter bar */}
      {showFilterBar && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
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

            {regions.length > 1 && (
              <select
                value={region}
                onChange={(e) => setParam("region", e.target.value)}
                aria-label={t("catalog.filter.region")}
                className="h-11 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">
                  {t("catalog.filter.region")}: {t("catalog.filter.all")}
                </option>
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
                onChange={(e) => setParam("difficulty", e.target.value)}
                aria-label={t("catalog.filter.difficulty")}
                className="h-11 rounded-md border border-input bg-background px-3 text-sm"
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

            <div className="flex items-center gap-1 rounded-full border p-1 sm:ml-auto">
              <button
                type="button"
                onClick={() => setParam("view", "list")}
                aria-pressed={view === "list"}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
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
                onClick={() => setParam("view", "map")}
                aria-pressed={view === "map"}
                disabled={mapPins.length === 0}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-40 ${
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

          <div className="flex flex-wrap items-center gap-2">
            <FilterChip active={genre === "all"} onClick={() => setParam("genre", "all")}>
              {t("catalog.filter.all")}
            </FilterChip>
            {GENRE_KEYS.map((key) => (
              <FilterChip
                key={key}
                active={genre === key}
                onClick={() => setParam("genre", key)}
              >
                {GENRES[key].label}
              </FilterChip>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">{filtered.length}</span>{" "}
              {t(
                filtered.length === 1
                  ? "catalog.filter.results.one"
                  : "catalog.filter.results.other",
              )}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="font-medium text-primary hover:underline"
              >
                {t("catalog.filter.reset")}
              </button>
            )}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed p-10 text-center">
          <p className="font-serif text-lg font-semibold">{t("catalog.filter.noResults")}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("catalog.filter.noResultsHint")}
          </p>
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={resetFilters}>
            {t("catalog.filter.reset")}
          </Button>
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
                  <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                  <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

