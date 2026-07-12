"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-context";

/**
 * Mobile Sticky-CTA: fixierte Leiste am unteren Rand mit "Tour starten",
 * die zum Player scrollt (kein GPS-Trigger). Blendet sich aus, sobald der
 * Player-Bereich im Viewport ist. Respektiert Safe-Area-Insets.
 */
export function TourStickyCta({ targetId }: { targetId: string }) {
  const { t } = useLanguage();
  // Ausblenden, sobald der Player sichtbar ist ODER darüber hinausgescrollt
  // wurde (top < 0) – so taucht die Leiste am Seitenende (Footer) nicht wieder auf.
  const [reachedPlayer, setReachedPlayer] = useState(false);

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) =>
        setReachedPlayer(
          entry.isIntersecting || entry.boundingClientRect.top < 0,
        ),
      { rootMargin: "0px 0px -40% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [targetId]);

  return (
    <div
      aria-hidden={reachedPlayer}
      className={`fixed inset-x-0 bottom-0 z-(--z-sticky) border-t border-border/70 bg-background/95 px-4 pt-3 backdrop-blur-md transition-opacity sm:hidden ${
        reachedPlayer ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <Button asChild size="lg" className="w-full">
        <a href={`#${targetId}`}>
          <Play aria-hidden="true" />
          {t("tour.startTour")}
        </a>
      </Button>
    </div>
  );
}
