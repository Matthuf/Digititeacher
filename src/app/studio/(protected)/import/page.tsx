import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TourImport } from "@/components/tour-import";

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href="/studio"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Zurück zum Studio
      </Link>

      <h1 className="mt-6 font-serif text-3xl font-semibold tracking-tight">
        Touren aus Excel importieren
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Lade eine Excel-Liste hoch, prüfe die Vorschau und importiere die
        Touren als Entwurf. Danach kannst du sie im Studio ergänzen,
        übersetzen und veröffentlichen.
      </p>

      {error && (
        <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-8">
        <TourImport />
      </div>
    </div>
  );
}
