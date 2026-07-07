"use client";

import { useRef, useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MAX_SIZE_MB = 50;

function readDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(Number.isFinite(audio.duration) ? Math.round(audio.duration) : null);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
    audio.src = objectUrl;
  });
}

export function AudioUpload({
  tourId,
  idPrefix,
  defaultUrl,
  defaultDuration,
  urlFieldName = "audio_url",
  durationFieldName = "audio_duration_seconds",
  label = "Audio",
}: {
  tourId: string;
  idPrefix: string;
  defaultUrl?: string | null;
  defaultDuration?: number | null;
  urlFieldName?: string;
  durationFieldName?: string;
  label?: string;
}) {
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [duration, setDuration] = useState<number | null>(
    defaultDuration ?? null,
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!file.type.startsWith("audio/")) {
      setError("Bitte eine Audiodatei wählen (z. B. MP3, M4A, OGG).");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Datei ist grösser als ${MAX_SIZE_MB} MB.`);
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const extension = file.name.split(".").pop()?.toLowerCase() || "mp3";
      const path = `${tourId}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("audio")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        setError(
          `Upload fehlgeschlagen: ${uploadError.message}. Wurde die Migration 002 (Audio-Bucket) in Supabase ausgeführt?`,
        );
        return;
      }

      const { data } = supabase.storage.from("audio").getPublicUrl(path);
      setUrl(data.publicUrl);
      setDuration(await readDuration(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload fehlgeschlagen.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={`${idPrefix}-audio-url`}>{label}</Label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0"
        >
          {uploading ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : (
            <UploadCloud aria-hidden="true" />
          )}
          {uploading ? "Lädt hoch …" : "Datei hochladen"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        <Input
          id={`${idPrefix}-audio-url`}
          name={urlFieldName}
          placeholder="… oder Audio-URL einfügen"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setDuration(null);
          }}
          className="min-w-0"
        />
      </div>
      <input type="hidden" name={durationFieldName} value={duration ?? ""} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {url && !uploading && (
        <audio controls preload="none" src={url} className="h-10 w-full" />
      )}
      {duration !== null && (
        <p className="text-xs text-muted-foreground">
          Länge: {Math.floor(duration / 60)}:
          {String(duration % 60).padStart(2, "0")} min
          {duration > 180 && (
            <span className="text-primary">
              {" "}
              – länger als 3 Minuten; für Wissens-Stationen eher kürzen.
            </span>
          )}
        </p>
      )}
    </div>
  );
}
