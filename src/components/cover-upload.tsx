"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MAX_SIZE_MB = 20;

export function CoverUpload({
  tourId,
  defaultUrl,
}: {
  tourId: string;
  defaultUrl?: string | null;
}) {
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Bitte ein Bild wählen.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Datei ist grösser als ${MAX_SIZE_MB} MB.`);
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${tourId}/cover-${crypto.randomUUID()}.${ext}`;
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload fehlgeschlagen.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="cover-url">Coverbild</Label>
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
            <ImagePlus aria-hidden="true" />
          )}
          {uploading ? "Lädt hoch …" : "Bild hochladen"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        <Input
          id="cover-url"
          name="cover_image_url"
          placeholder="… oder Bild-URL einfügen"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="min-w-0"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {url && !uploading && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="Cover-Vorschau"
          className="h-32 w-full max-w-xs rounded-md border object-cover"
        />
      )}
    </div>
  );
}
