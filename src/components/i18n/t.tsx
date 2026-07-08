"use client";

import { useLanguage } from "@/lib/i18n/language-context";

/** Rendert einen übersetzten Textknoten – nutzbar auch innerhalb von Server Components. */
export function T({ k, fallback }: { k: string; fallback?: string }) {
  const { t } = useLanguage();
  return <>{t(k, fallback)}</>;
}
