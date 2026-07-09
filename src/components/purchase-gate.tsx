"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-context";

export function PurchaseGate({
  tourId,
  price,
  justPurchased,
  checkoutAction,
  children,
}: {
  tourId: string;
  price: number;
  justPurchased: boolean;
  checkoutAction: (formData: FormData) => void;
  children: React.ReactNode;
}) {
  const { t } = useLanguage();
  const storageKey = `dt-purchased-${tourId}`;
  const [unlocked, setUnlocked] = useState<boolean | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (justPurchased) {
        try {
          localStorage.setItem(storageKey, "1");
        } catch {
          // ignorieren
        }
        setUnlocked(true);
        return;
      }
      try {
        setUnlocked(localStorage.getItem(storageKey) === "1");
      } catch {
        setUnlocked(false);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [storageKey, justPurchased]);

  if (unlocked === null) return null;
  if (unlocked) return <>{children}</>;

  return (
    <div className="rounded-2xl border border-dashed p-8 text-center">
      <Lock aria-hidden="true" className="mx-auto size-6 text-primary" />
      <p className="mt-3 text-sm text-muted-foreground">{t("purchase.locked")}</p>
      <form action={checkoutAction} className="mt-4">
        <Button type="submit" className="rounded-full px-6">
          {t("purchase.buy")} — CHF {price.toFixed(2)}
        </Button>
      </form>
    </div>
  );
}
