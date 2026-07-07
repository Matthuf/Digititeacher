import { upsertTranslations } from "@/app/studio/actions";
import { AudioUpload } from "@/components/audio-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TRANSLATION_LOCALE_KEYS,
  TRANSLATION_LOCALES,
} from "@/lib/locales";
import type {
  Station,
  StationTranslation,
  Tour,
  TourTranslation,
} from "@/lib/tours";

export function TranslationsEditor({
  tour,
  stations,
  tourTranslations,
  stationTranslations,
}: {
  tour: Tour;
  stations: Station[];
  tourTranslations: TourTranslation[];
  stationTranslations: StationTranslation[];
}) {
  return (
    <Card className="mt-10">
      <CardHeader>
        <CardTitle className="text-base">Übersetzungen</CardTitle>
        <p className="text-sm text-muted-foreground">
          Deutsch ist die Basis. Leere Felder fallen für Gäste automatisch auf
          die deutsche Fassung zurück. Der Sprachumschalter erscheint nur bei
          Sprachen mit Inhalten.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {TRANSLATION_LOCALE_KEYS.map((locale) => {
          const tourT = tourTranslations.find((t) => t.locale === locale);
          const stationTs = stationTranslations.filter(
            (t) => t.locale === locale,
          );
          const filled = Boolean(tourT) || stationTs.length > 0;

          return (
            <details key={locale} className="group rounded-lg border">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium">
                <span>
                  {TRANSLATION_LOCALES[locale]}{" "}
                  <span className="text-muted-foreground">({locale})</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {filled ? "Inhalte vorhanden" : "leer"}
                </span>
              </summary>
              <form
                action={upsertTranslations.bind(null, tour.id, locale)}
                className="flex flex-col gap-4 border-t px-4 py-4"
              >
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`${locale}-tour-title`}>
                    Tour-Titel ({tour.title})
                  </Label>
                  <Input
                    id={`${locale}-tour-title`}
                    name="tour-title"
                    defaultValue={tourT?.title ?? ""}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`${locale}-tour-description`}>
                    Tour-Beschreibung
                  </Label>
                  <Textarea
                    id={`${locale}-tour-description`}
                    name="tour-description"
                    className="min-h-16"
                    defaultValue={tourT?.description ?? ""}
                  />
                </div>

                {stations.map((station, index) => {
                  const t = stationTs.find(
                    (st) => st.station_id === station.id,
                  );
                  const p = `s-${station.id}`;
                  return (
                    <fieldset
                      key={station.id}
                      className="flex flex-col gap-4 rounded-lg border p-4"
                    >
                      <legend className="px-1 text-sm font-medium">
                        Station {index + 1}: {station.title}
                      </legend>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor={`${locale}-${p}-title`}>Titel</Label>
                        <Input
                          id={`${locale}-${p}-title`}
                          name={`${p}-title`}
                          defaultValue={t?.title ?? ""}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor={`${locale}-${p}-description`}>
                          Beschreibung
                        </Label>
                        <Input
                          id={`${locale}-${p}-description`}
                          name={`${p}-description`}
                          defaultValue={t?.description ?? ""}
                        />
                      </div>
                      <AudioUpload
                        tourId={tour.id}
                        idPrefix={`${locale}-${p}`}
                        defaultUrl={t?.audio_url}
                        defaultDuration={t?.audio_duration_seconds}
                        urlFieldName={`${p}-audio_url`}
                        durationFieldName={`${p}-audio_duration_seconds`}
                        label={`Audio (${TRANSLATION_LOCALES[locale]})`}
                      />
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor={`${locale}-${p}-transcript`}>
                          Transkript
                        </Label>
                        <Textarea
                          id={`${locale}-${p}-transcript`}
                          name={`${p}-transcript`}
                          defaultValue={t?.transcript ?? ""}
                        />
                      </div>
                    </fieldset>
                  );
                })}

                <Button type="submit" className="self-start">
                  {TRANSLATION_LOCALES[locale]} speichern
                </Button>
              </form>
            </details>
          );
        })}
      </CardContent>
    </Card>
  );
}
