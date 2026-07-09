"use client";

import { useEffect, useState } from "react";
import { Check, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  cacheTourForOffline,
  isTourCached,
  removeTourOfflineCache,
} from "@/lib/offline";

type Status = "checking" | "idle" | "downloading" | "done" | "error";

export function OfflineDownloadButton({
  tourId,
  urls,
}: {
  tourId: string;
  urls: string[];
}) {
  const { t } = useLanguage();
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let active = true;
    isTourCached(tourId).then((cached) => {
      if (active) setStatus(cached ? "done" : "idle");
    });
    return () => {
      active = false;
    };
  }, [tourId]);

  async function download() {
    setStatus("downloading");
    try {
      await cacheTourForOffline(tourId, urls);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  async function remove() {
    await removeTourOfflineCache(tourId);
    setStatus("idle");
  }

  if (status === "checking") return null;

  if (status === "done") {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="flex items-center gap-1.5 font-medium text-mist">
          <Check aria-hidden="true" className="size-4" />
          {t("offline.done")}
        </span>
        <button
          type="button"
          onClick={remove}
          className="text-muted-foreground underline-offset-2 hover:underline"
        >
          {t("offline.remove")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={status === "downloading"}
        onClick={download}
        className="self-start"
      >
        {status === "downloading" ? (
          <Loader2 aria-hidden="true" className="animate-spin" />
        ) : (
          <Download aria-hidden="true" />
        )}
        {status === "downloading" ? t("offline.downloading") : t("offline.download")}
      </Button>
      {status === "error" && (
        <p className="text-sm text-destructive">{t("offline.error")}</p>
      )}
    </div>
  );
}
