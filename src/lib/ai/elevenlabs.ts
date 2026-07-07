import { ELEVENLABS_MODEL } from "@/lib/ai/voices";

export function elevenLabsConfigured(): boolean {
  return !!process.env.ELEVENLABS_API_KEY;
}

/** Erzeugt aus Text eine MP3 und gibt die rohen Bytes zurück. */
export async function elevenLabsTts(
  text: string,
  voiceId: string,
): Promise<ArrayBuffer> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY ist nicht gesetzt.");

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_MODEL,
      }),
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `ElevenLabs-Fehler (${res.status}): ${detail.slice(0, 200)}`,
    );
  }

  return res.arrayBuffer();
}
