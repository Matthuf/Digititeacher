"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TourCard } from "@/components/tour-card";
import type { TourWithPin } from "@/lib/get-tours";

export function TourCarousel({ tours }: { tours: TourWithPin[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollByAmount(direction: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector("[data-carousel-item]");
    const step = card ? card.clientWidth + 20 : 320;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tours.map((tour) => (
          <div
            key={tour.id}
            data-carousel-item
            className="w-[78vw] shrink-0 snap-start sm:w-80"
          >
            <TourCard tour={tour} />
          </div>
        ))}
      </div>

      {tours.length > 1 && (
        <div className="mt-4 hidden items-center justify-end gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scrollByAmount(-1)}
            aria-label="Zurück"
            className="flex size-10 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount(1)}
            aria-label="Weiter"
            className="flex size-10 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
