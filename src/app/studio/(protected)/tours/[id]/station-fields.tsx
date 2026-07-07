import { Sparkles } from "lucide-react";
import { generateStationAudio } from "@/app/studio/ai-actions";
import { AudioUpload } from "@/components/audio-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AiStatus } from "@/lib/ai/status";
import type { Station } from "@/lib/tours";

export function StationFields({
  idPrefix,
  tourId,
  station,
  ai,
}: {
  idPrefix: string;
  tourId: string;
  station?: Station;
  ai?: AiStatus;
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-title`}>Titel</Label>
        <Input
          id={`${idPrefix}-title`}
          name="title"
          defaultValue={station?.title ?? ""}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-description`}>Beschreibung</Label>
        <Input
          id={`${idPrefix}-description`}
          name="description"
          defaultValue={station?.description ?? ""}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-latitude`}>Breitengrad</Label>
          <Input
            id={`${idPrefix}-latitude`}
            name="latitude"
            type="number"
            step="any"
            defaultValue={station?.latitude ?? ""}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-longitude`}>Längengrad</Label>
          <Input
            id={`${idPrefix}-longitude`}
            name="longitude"
            type="number"
            step="any"
            defaultValue={station?.longitude ?? ""}
            required
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-radius`}>
          GPS-Auslöseradius (Meter, leer = 40)
        </Label>
        <Input
          id={`${idPrefix}-radius`}
          name="trigger_radius_m"
          type="number"
          min={5}
          max={500}
          defaultValue={station?.trigger_radius_m ?? ""}
          placeholder="40"
        />
      </div>
      <AudioUpload
        tourId={tourId}
        idPrefix={idPrefix}
        defaultUrl={station?.audio_url}
        defaultDuration={station?.audio_duration_seconds}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-transcript`}>
          Transkript (wird Gästen als Text angeboten)
        </Label>
        <Textarea
          id={`${idPrefix}-transcript`}
          name="transcript"
          defaultValue={station?.transcript ?? ""}
          placeholder="Der gesprochene Text dieser Station …"
        />
      </div>
      {ai?.elevenlabs && station && (
        <div>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            formAction={generateStationAudio.bind(
              null,
              tourId,
              station.id,
              "de",
            )}
          >
            <Sparkles aria-hidden="true" />
            Deutsches Audio erzeugen (ElevenLabs)
          </Button>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Nutzt das gespeicherte Transkript – erst speichern.
          </p>
        </div>
      )}
    </>
  );
}
