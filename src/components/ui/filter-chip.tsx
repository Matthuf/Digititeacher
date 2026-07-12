import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Genre-/Kategorie-Filter als Chip-Reihe (Anforderungsdokument §5.1/§15.1). */
export function FilterChip({
  active,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background text-muted-foreground pointer-fine:hover:border-primary/40 pointer-fine:hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}
