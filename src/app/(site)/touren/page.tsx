import Link from "next/link";
import { Compass } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { getPublishedToursWithPins, type TourWithPin } from "@/lib/get-tours";
import { Reveal } from "@/components/reveal";
import { CatalogBrowser } from "@/components/catalog-browser";
import { T } from "@/components/i18n/t";

export const metadata = {
  title: "Touren – SendaLore",
  description:
    "Alle SendaLore-Audiotouren: Natur, Kultur und kleine Abenteuer. Filtern, suchen oder auf der Karte entdecken.",
};

export default async function ToursPage() {
  let tours: TourWithPin[] = [];
  let loadError = false;

  if (isSupabaseConfigured) {
    try {
      tours = await getPublishedToursWithPins();
    } catch {
      loadError = true;
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <Reveal>
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            <T k="catalog.title" />
          </h1>
          {tours.length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {tours.length}{" "}
              <T k={tours.length === 1 ? "catalog.count.one" : "catalog.count.other"} />
            </p>
          )}
        </div>
      </Reveal>

      {!isSupabaseConfigured && (
        <Reveal delay={0.1}>
          <div className="mt-10 rounded-2xl border border-dashed p-10 text-center">
            <Compass
              aria-hidden="true"
              className="mx-auto size-8 text-muted-foreground"
            />
            <p className="mt-4 text-sm text-muted-foreground">
              <T k="catalog.notConfigured" />
            </p>
          </div>
        </Reveal>
      )}

      {loadError && (
        <Reveal delay={0.1}>
          <div className="mt-10 rounded-2xl border border-destructive/40 bg-destructive/5 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              <T k="catalog.loadError" />
            </p>
          </div>
        </Reveal>
      )}

      {isSupabaseConfigured && !loadError && tours.length === 0 && (
        <Reveal delay={0.1}>
          <div className="mt-10 rounded-2xl border border-dashed p-10 text-center">
            <Compass
              aria-hidden="true"
              className="mx-auto size-8 text-muted-foreground"
            />
            <p className="mt-4 text-sm text-muted-foreground">
              <T k="catalog.empty.before" />{" "}
              <Link href="/studio" className="underline hover:text-foreground">
                <T k="catalog.empty.studio" />
              </Link>
              .
            </p>
          </div>
        </Reveal>
      )}

      {isSupabaseConfigured && !loadError && tours.length > 0 && (
        <CatalogBrowser tours={tours} />
      )}
    </div>
  );
}
