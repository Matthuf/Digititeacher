import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Headphones, MapPin, Mountain } from "lucide-react";
import { Ridgeline } from "@/components/ridgeline";
import { GENRES, isGenre } from "@/lib/genres";
import type { Tour } from "@/lib/tours";

export function TourCard({ tour }: { tour: Tour }) {
  const genre = isGenre(tour.genre) ? GENRES[tour.genre] : null;

  return (
    <Link href={`/touren/${tour.slug}`} className="group block h-full">
      <article className="tr-tile flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="relative aspect-[3/2] overflow-hidden">
          {tour.cover_image_url ? (
            <Image
              src={tour.cover_image_url}
              alt={`Cover von ${tour.title}`}
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="absolute inset-0 flex items-end bg-secondary">
              <div className="absolute right-6 top-5 size-16 rounded-full bg-primary/60 blur-xl" />
              <div className="absolute right-8 top-7 size-8 rounded-full bg-primary/90 blur-[2px]" />
              <div
                className="absolute inset-x-0 bottom-0 h-1/2 opacity-25"
                style={{
                  background: "linear-gradient(to top, var(--mist), transparent)",
                }}
              />
              <Headphones
                aria-hidden="true"
                className="absolute bottom-4 right-4 size-5 text-background/50"
              />
              <Ridgeline className="relative h-20 w-full text-background/70" />
            </div>
          )}
          {genre && (
            <span
              className={`absolute left-3 top-3 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm ${genre.badgeClass} bg-background/85`}
            >
              {genre.label}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="font-serif text-xl font-semibold tracking-tight transition-colors group-hover:text-primary">
            {tour.title}
          </h3>
          {tour.description && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {tour.description}
            </p>
          )}
          <div className="mt-auto flex items-center gap-4 pt-5 text-xs text-muted-foreground">
            {tour.region && (
              <span className="flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="size-3.5" />
                {tour.region}
              </span>
            )}
            {tour.duration_minutes && (
              <span className="flex items-center gap-1.5">
                <Clock aria-hidden="true" className="size-3.5" />
                <span className="tabular-nums">{tour.duration_minutes} min</span>
              </span>
            )}
            {tour.difficulty && (
              <span className="hidden items-center gap-1.5 sm:flex">
                <Mountain aria-hidden="true" className="size-3.5" />
                {tour.difficulty}
              </span>
            )}
            <ArrowRight
              aria-hidden="true"
              className="ml-auto size-4 text-primary transition-transform duration-300 group-hover:translate-x-1"
            />
          </div>
        </div>
      </article>
    </Link>
  );
}
