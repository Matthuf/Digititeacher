import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-baseline gap-1">
          <span className="font-serif text-xl font-semibold tracking-tight">
            Digititeacher
          </span>
          <span className="size-1.5 translate-y-[-2px] rounded-full bg-primary transition-transform group-hover:scale-125" />
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/#touren"
            className="tr-navlink text-muted-foreground transition-colors hover:text-foreground"
          >
            Touren
          </Link>
          <Link
            href="/studio"
            className="rounded-md border px-3 py-1.5 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            Studio
          </Link>
        </nav>
      </div>
    </header>
  );
}
