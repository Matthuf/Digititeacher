"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { UI_LOCALES, type UiLocale } from "@/lib/i18n/dictionaries";

export function LanguageSwitch({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Sprache / Language"
      className={`flex items-center gap-0.5 rounded-full border p-0.5 text-xs font-medium ${className ?? ""}`}
    >
      {(Object.keys(UI_LOCALES) as UiLocale[]).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-current={lang === code ? "true" : undefined}
          className={`rounded-full px-2 py-1 uppercase transition-colors ${
            lang === code
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
