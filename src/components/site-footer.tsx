import Link from "next/link";
import { Ridgeline } from "@/components/ridgeline";

export function SiteFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t">
      <Ridgeline className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full text-foreground/60" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-2 px-6 py-12">
        <p className="font-serif text-lg font-semibold">
          Digititeacher
          <span className="text-primary">.</span>
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          Handgemachte Audiotouren für draussen – recherchiert, geschrieben und
          vertont.
        </p>
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Digititeacher</span>
          <Link href="/studio" className="hover:text-foreground">
            Studio
          </Link>
        </div>
      </div>
    </footer>
  );
}
