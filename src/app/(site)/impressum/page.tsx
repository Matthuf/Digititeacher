import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Impressum – SendaLore",
  description: "Anbieterkennzeichnung und Kontaktangaben von SendaLore.",
};

// Rechtsseite bewusst deutsch (an die Betreiber-Jurisdiktion gebunden,
// kein produktseitiger UI-Text). Alle konkreten Angaben sind Platzhalter
// und müssen vor dem Launch juristisch geprüft und ausgefüllt werden.
export default function ImpressumPage() {
  return (
    <article className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
      <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
        Impressum
      </h1>

      <div
        role="note"
        className="mt-6 flex items-start gap-3 rounded-xl border border-primary/40 bg-primary/[0.05] p-4 text-sm"
      >
        <AlertTriangle
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-primary"
        />
        <p className="text-foreground">
          <strong className="font-semibold">Platzhalter.</strong> Diese Seite
          enthält noch keine rechtsverbindlichen Angaben. Vor der
          Veröffentlichung müssen alle mit{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            [PLATZHALTER]
          </code>{" "}
          markierten Felder ausgefüllt und der Text rechtlich geprüft werden.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-8 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="text-lg font-semibold text-foreground">Anbieter</h2>
          <p className="mt-2">
            [PLATZHALTER — Name / Firma]
            <br />
            [PLATZHALTER — Strasse und Hausnummer]
            <br />
            [PLATZHALTER — PLZ und Ort]
            <br />
            [PLATZHALTER — Land]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Kontakt</h2>
          <p className="mt-2">
            E-Mail: [PLATZHALTER — Kontakt-E-Mail]
            <br />
            Telefon: [PLATZHALTER — optional]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Vertretungsberechtigte Person
          </h2>
          <p className="mt-2">[PLATZHALTER — Name der verantwortlichen Person]</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Handelsregister / MWST
          </h2>
          <p className="mt-2">
            Handelsregister-Nr.: [PLATZHALTER — falls vorhanden]
            <br />
            MWST-Nr.: [PLATZHALTER — falls vorhanden]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Verantwortlich für den Inhalt
          </h2>
          <p className="mt-2">
            [PLATZHALTER — Name und Adresse der inhaltlich verantwortlichen
            Person]
          </p>
        </section>
      </div>
    </article>
  );
}
