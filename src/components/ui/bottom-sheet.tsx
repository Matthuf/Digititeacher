"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

/**
 * Wiederverwendbares Bottom Sheet (Design-System §15.1). Deckt am unteren
 * Rand ein Panel auf, mit halbtransparentem Backdrop zum Schliessen. Escape
 * und Backdrop-Klick schliessen; kein Focus-Trap (Tab-Reihenfolge bleibt
 * erhalten). Slide-in respektiert `prefers-reduced-motion` (siehe `.sl-sheet`
 * in globals.css) und nutzt die Motion-/Z-Index-Tokens.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  closeLabel,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  closeLabel?: string;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const label = closeLabel ?? t("player.back");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-(--z-overlay) flex flex-col justify-end"
    >
      <button
        type="button"
        aria-label={label}
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-[1px]"
      />
      <div className="sl-sheet relative flex max-h-[85vh] flex-col rounded-t-2xl border bg-background p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={label}
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
