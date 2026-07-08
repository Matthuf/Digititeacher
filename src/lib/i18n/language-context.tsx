"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  DEFAULT_UI_LOCALE,
  dictionaries,
  type UiLocale,
} from "@/lib/i18n/dictionaries";

const COOKIE_NAME = "sendalore-ui-lang";

type LanguageContextValue = {
  lang: UiLocale;
  setLang: (lang: UiLocale) => void;
  t: (key: string, fallback?: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  initialLang,
  children,
}: {
  initialLang: UiLocale;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<UiLocale>(initialLang ?? DEFAULT_UI_LOCALE);

  const setLang = useCallback((next: UiLocale) => {
    setLangState(next);
    if (typeof document !== "undefined") {
      document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=31536000; samesite=lax`;
    }
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) => {
      return dictionaries[lang][key] ?? fallback ?? dictionaries.de[key] ?? key;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}

export { COOKIE_NAME as UI_LANG_COOKIE };
