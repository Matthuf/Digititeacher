import Link from "next/link";
import { Ridgeline } from "@/components/ridgeline";
import { T } from "@/components/i18n/t";

export function SiteFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t">
      <Ridgeline className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full text-foreground/60" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-2 px-6 py-12">
        <p className="font-serif text-lg font-semibold">
          SendaLore
          <span className="text-primary">.</span>
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          <T k="footer.tagline" />
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} SendaLore</span>
          <Link href="/impressum" className="hover:text-foreground">
            <T k="footer.impressum" />
          </Link>
          <Link href="/datenschutz" className="hover:text-foreground">
            <T k="footer.datenschutz" />
          </Link>
          <Link href="/studio" className="hover:text-foreground">
            <T k="footer.studio" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
