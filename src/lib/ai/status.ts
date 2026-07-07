import { deeplConfigured } from "@/lib/ai/deepl";
import { elevenLabsConfigured } from "@/lib/ai/elevenlabs";

export type AiStatus = { deepl: boolean; elevenlabs: boolean };

export function aiStatus(): AiStatus {
  return { deepl: deeplConfigured(), elevenlabs: elevenLabsConfigured() };
}
