"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { addStationMedia } from "@/app/studio/actions";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MAX_SIZE_MB = 200;

export function MediaUpload({
  tourId,
  stationId,
}: {
  tourId: string;
  stationId: string;
}) {
  const [url, setUrl] = useState("");
  const [type, setType] = useState<"image" | "video">("image");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      setError("Bitte ein Bild oder Video wählen.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Datei ist grösser als ${MAX_SIZE_MB} MB.`);
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const path = `${tourId}/${stationId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        setError(
          `Upload fehlgeschlagen: ${uploadError.message}. Migration 004 (media-Bucket) in Supabase ausgeführt?`,
        );
        return;
      }
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      setUrl(data.publicUrl);
      setType(isVideo ? "video" : "image");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload fehlgeschlagen.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      action={addStationMedia.bind(null, tourId, stationId)}
      className="flex flex-col gap-3 rounded-lg border border-dashed p-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : (
            <ImagePlus aria-hidden="true" />
          )}
          {uploading ? "Lädt hoch …" : "Bild/Video hochladen"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        <Input
          placeholder="… oder Medien-URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="min-w-0 flex-1"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "image" | "video")}
          aria-label="Medientyp"
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="image">Bild</option>
          <option value="video">Video</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor={`cap-${stationId}`} className="sr-only">
          Bildunterschrift
        </Label>
        <Input
          id={`cap-${stationId}`}
          name="caption"
          placeholder="Bildunterschrift (optional)"
          className="flex-1"
        />
        <input type="hidden" name="url" value={url} />
        <input type="hidden" name="media_type" value={type} />
        <Button type="submit" size="sm" disabled={!url || uploading}>
          Hinzufügen
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {url && type === "image" && !uploading && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="Vorschau"
          className="max-h-32 w-fit rounded-md object-cover"
        />
      )}
      {url && type === "video" && !uploading && (
        <video src={url} controls className="max-h-32 w-fit rounded-md" />
      )}
    </form>
  );
}
