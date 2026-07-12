"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n/language-context";

export function PurchaseGate({
  tourId,
  price,
  unlocked,
  restoreFailed,
  checkoutAction,
  restoreAction,
  children,
}: {
  tourId: string;
  price: number;
  /** Serverseitig verifiziert: frischer Kauf oder wiederhergestellter Kauf. */
  unlocked: boolean;
  /** E-Mail-Wiederherstellung fehlgeschlagen (kein Kauf gefunden). */
  restoreFailed?: boolean;
  checkoutAction: (formData: FormData) => void;
  restoreAction: (formData: FormData) => void;
  children: React.ReactNode;
}) {
  const { t } = useLanguage();
  const storageKey = `dt-purchased-${tourId}`;
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (unlocked) {
        try {
          localStorage.setItem(storageKey, "1");
        } catch {
          // ignorieren
        }
        setIsUnlocked(true);
        return;
      }
      try {
        setIsUnlocked(localStorage.getItem(storageKey) === "1");
      } catch {
        setIsUnlocked(false);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [storageKey, unlocked]);

  if (isUnlocked === null) return null;
  if (isUnlocked) return <>{children}</>;

  return (
    <div className="rounded-2xl border border-dashed p-8 text-center">
      <Lock aria-hidden="true" className="mx-auto size-6 text-primary" />
      <p className="mt-3 text-sm text-muted-foreground">{t("purchase.locked")}</p>
      <form action={checkoutAction} className="mt-4">
        <Button type="submit" className="rounded-full px-6">
          {t("purchase.buy")} — CHF {price.toFixed(2)}
        </Button>
      </form>

      <details className="group mt-5 text-left" open={restoreFailed}>
        <summary className="cursor-pointer list-none text-center text-sm font-medium text-primary hover:underline">
          {t("purchase.restore.trigger")}
        </summary>
        <form action={restoreAction} className="mx-auto mt-3 flex max-w-sm flex-col gap-2">
          <label htmlFor="restore-email" className="sr-only">
            {t("purchase.restore.emailLabel")}
          </label>
          <Input
            id="restore-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={t("purchase.restore.emailPlaceholder")}
          />
          <Button type="submit" variant="outline" className="rounded-full">
            {t("purchase.restore.submit")}
          </Button>
          {restoreFailed && (
            <p className="text-sm text-destructive" role="alert">
              {t("purchase.restore.notFound")}
            </p>
          )}
        </form>
      </details>
    </div>
  );
}
