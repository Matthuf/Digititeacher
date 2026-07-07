import type { Genre } from "@/lib/genres";

// ElevenLabs-Stimmen pro Erlebnis-Genre. Öffentliche Standard-Stimm-IDs von
// ElevenLabs (eleven_multilingual_v2, deckt DE/EN/IT/FR ab). Pro Genre über
// Umgebungsvariablen überschreibbar, z. B. ELEVENLABS_VOICE_KINDER=<id>.
// Die endgültige Stimmauswahl aus der Masterarbeit hier eintragen.

type VoiceDef = { id: string; name: string };

const DEFAULT_VOICES: Record<Genre | "default", VoiceDef> = {
  wissen: { id: "JBFqnCBsd6RMkjVDRZzb", name: "George (sachlich, warm)" },
  kinder: { id: "XB0fDUnXU5powFXDhCwa", name: "Charlotte (warm, erzählend)" },
  romantik: { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily (weich)" },
  sagen: { id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum (dramatisch)" },
  schule: { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah (klar)" },
  default: { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah (klar)" },
};

export function voiceForGenre(genre: string | null | undefined): VoiceDef {
  const key = (genre ?? "default") as Genre | "default";
  const base = DEFAULT_VOICES[key] ?? DEFAULT_VOICES.default;
  const envId =
    process.env[`ELEVENLABS_VOICE_${(genre ?? "default").toUpperCase()}`];
  return envId ? { id: envId, name: `${base.name} (override)` } : base;
}

export const ELEVENLABS_MODEL = "eleven_multilingual_v2";
