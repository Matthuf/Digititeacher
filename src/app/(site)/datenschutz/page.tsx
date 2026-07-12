import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Datenschutz – SendaLore",
  description: "Wie SendaLore mit deinen Daten umgeht.",
};

// Rechtsseite bewusst deutsch (an die Betreiber-Jurisdiktion gebunden).
// Inhalt beschreibt die tatsächliche technische Datenverarbeitung, ist aber
// juristisch ungeprüft und vor dem Launch anwaltlich zu bestätigen.
export default function DatenschutzPage() {
  return (
    <article className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
      <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
        Datenschutzerklärung
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
          <strong className="font-semibold">Platzhalter.</strong> Dieser Text
          beschreibt die technische Datenverarbeitung nach bestem Wissen, ist
          aber noch <strong>nicht rechtlich geprüft</strong>. Er ist kein
          Ersatz für eine anwaltlich abgesicherte Datenschutzerklärung und muss
          vor dem Launch geprüft und vervollständigt werden.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-8 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Verantwortliche Stelle
          </h2>
          <p className="mt-2">
            Verantwortlich für die Datenverarbeitung auf dieser Website ist:
          </p>
          <p className="mt-2">
            [PLATZHALTER — Name / Firma]
            <br />
            [PLATZHALTER — Adresse]
            <br />
            E-Mail: [PLATZHALTER — Kontakt-E-Mail]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            GPS-Standort
          </h2>
          <p className="mt-2">
            Für die Audiotouren fragt die Website deinen Standort ab. Die
            GPS-Position wird ausschliesslich lokal in deinem Browser
            verarbeitet, um Geschichten an der passenden Station automatisch zu
            starten. Deine Position wird nicht an unsere Server übertragen und
            nicht gespeichert. Eine Ausnahme entsteht nur, wenn du die
            optionale Weg-Berechnung zur nächsten Station nutzt: In diesem Fall
            werden Start- und Zielkoordinaten an unseren Routing-Dienstleister
            übermittelt, um den Fussweg zu berechnen (siehe
            &bdquo;Auftragsverarbeiter&ldquo;).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            E-Mail-Adresse bei Kauf
          </h2>
          <p className="mt-2">
            Bei einem kostenpflichtigen Kauf wird die Zahlung über unseren
            Zahlungsdienstleister Stripe abgewickelt. Dabei wird die von dir im
            Bezahlvorgang angegebene E-Mail-Adresse zusammen mit einer
            Zahlungsreferenz gespeichert, um den Kauf nachzuweisen und dir den
            Zugang auch auf einem anderen Gerät wiederherstellen zu können.
            Zahlungsdaten (Kartennummer o. Ä.) werden ausschliesslich von
            Stripe verarbeitet und erreichen unsere Server nicht.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Cookies und lokale Speicherung
          </h2>
          <p className="mt-2">
            Zur Speicherung deiner gewählten Anzeigesprache setzen wir ein
            technisch notwendiges Cookie. Deinen Tour-Fortschritt (gehörte
            Stationen, Quiz-Antworten, freigeschaltete Käufe) speichern wir im
            lokalen Speicher (localStorage) deines Browsers – diese Daten
            verlassen dein Gerät nicht und werden nicht an uns übertragen.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Aufrufstatistik
          </h2>
          <p className="mt-2">
            Wir zählen die Aufrufe einer Tour, um zu sehen, welche Inhalte
            genutzt werden. Dabei werden keine personenbezogenen Merkmale wie
            IP-Adressen dauerhaft mit dem Aufruf verknüpft gespeichert.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Auftragsverarbeiter
          </h2>
          <p className="mt-2">
            Wir nutzen für den Betrieb der Website externe Dienstleister, u. a.:
          </p>
          <ul className="mt-2 list-disc pl-5">
            <li>Supabase (Datenbank und Datei-Hosting)</li>
            <li>Stripe (Zahlungsabwicklung)</li>
            <li>Kartenkacheln- und Routing-Anbieter (Wegdarstellung)</li>
            <li>Hosting-Anbieter der Website</li>
          </ul>
          <p className="mt-2">
            [PLATZHALTER — konkrete Anbieter, Standorte und
            Auftragsverarbeitungsverträge ergänzen]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Deine Rechte
          </h2>
          <p className="mt-2">
            Du hast das Recht auf Auskunft, Berichtigung, Löschung und
            Einschränkung der Verarbeitung deiner personenbezogenen Daten sowie
            das Recht auf Datenübertragbarkeit. Für Anfragen wende dich an:
            [PLATZHALTER — Kontakt-E-Mail für Auskunftsrechte].
          </p>
        </section>
      </div>
    </article>
  );
}
