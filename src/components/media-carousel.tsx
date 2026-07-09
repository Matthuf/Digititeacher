"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { StationMedia } from "@/lib/tours";

export function MediaCarousel({ media }: { media: StationMedia[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  if (media.length === 0) return null;

  function scrollTo(i: number) {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const clamped = Math.max(0, Math.min(i, media.length - 1));
    const child = scroller.children[clamped] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    setIndex(clamped);
  }

  const single = media.length === 1;

  return (
    <div className="relative mt-4">
      <div
        ref={scrollerRef}
        onScroll={(e) => {
          const scroller = e.currentTarget;
          const i = Math.round(scroller.scrollLeft / scroller.clientWidth);
          if (i !== index) setIndex(i);
        }}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth rounded-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {media.map((m) => (
          <div
            key={m.id}
            className="relative aspect-video w-full shrink-0 snap-start overflow-hidden rounded-xl border bg-muted"
          >
            {m.media_type === "video" ? (
              <video
                src={m.url}
                controls
                preload="metadata"
                className="h-full w-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.url}
                alt={m.caption ?? "Stationsbild"}
                loading="lazy"
                className="absolute inset-0 size-full object-cover"
              />
            )}
            {m.caption && (
              <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-2 text-sm text-white">
                {m.caption}
              </p>
            )}
          </div>
        ))}
      </div>

      {!single && (
        <>
          <button
            type="button"
            aria-label="Vorheriges Medium"
            onClick={() => scrollTo(index - 1)}
            disabled={index === 0}
            className="absolute left-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 shadow-sm backdrop-blur-sm transition-opacity hover:bg-background disabled:opacity-0"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Nächstes Medium"
            onClick={() => scrollTo(index + 1)}
            disabled={index === media.length - 1}
            className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 shadow-sm backdrop-blur-sm transition-opacity hover:bg-background disabled:opacity-0"
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>
          <div className="mt-3 flex justify-center gap-1.5">
            {media.map((m, i) => (
              <button
                key={m.id}
                type="button"
                aria-label={`Zu Medium ${i + 1}`}
                onClick={() => scrollTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
