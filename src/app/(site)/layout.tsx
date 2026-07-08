import { cookies } from "next/headers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { DEFAULT_UI_LOCALE, isUiLocale } from "@/lib/i18n/dictionaries";
import { UI_LANG_COOKIE } from "@/lib/i18n/language-context";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get(UI_LANG_COOKIE)?.value;
  const initialLang = isUiLocale(cookieLang) ? cookieLang : DEFAULT_UI_LOCALE;

  return (
    <LanguageProvider initialLang={initialLang}>
      <div className="flex flex-1 flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </LanguageProvider>
  );
}
