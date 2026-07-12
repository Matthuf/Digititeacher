import { Sparkles } from "lucide-react";
import { generateStationAudio } from "@/app/studio/ai-actions";
import { AudioUpload } from "@/components/audio-upload";
import { StationCoordinatePicker } from "@/components/station-coordinate-picker";
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
  mapCenter,
}: {
  idPrefix: string;
  tourId: string;
  station?: Station;
  ai?: AiStatus;
  /** Fallback-Kartenzentrum für neue Stationen (Schwerpunkt der übrigen). */
  mapCenter?: { lat: number; lng: number } | null;
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
      <StationCoordinatePicker
        idPrefix={idPrefix}
        defaultLat={station?.latitude ?? null}
        defaultLng={station?.longitude ?? null}
        center={mapCenter}
      />
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
