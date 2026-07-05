import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold">
          Digititeacher Audioguides
        </Link>
        <Link
          href="/studio"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Studio
        </Link>
      </div>
    </header>
  );
}
