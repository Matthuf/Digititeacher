"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { TourFeedback } from "@/lib/tours";

function Stars({ value, size = "size-4" }: { value: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5 text-primary">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={size}
          fill={i <= value ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

export function TourFeedbackSection({
  action,
  feedback,
  justSubmitted,
  error,
  lang,
}: {
  action: (formData: FormData) => void;
  feedback: TourFeedback[];
  justSubmitted: boolean;
  error?: string;
  lang?: string;
}) {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const count = feedback.length;
  const average =
    count > 0 ? feedback.reduce((sum, f) => sum + f.rating, 0) / count : 0;
  const comments = feedback.filter((f) => f.comment).slice(0, 5);

  return (
    <section className="mt-14 border-t pt-10">
      <h2 className="font-serif text-2xl font-semibold tracking-tight">
        {t("feedback.title")}
      </h2>

      {count > 0 && (
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Stars value={Math.round(average)} />
          <span>
            {average.toFixed(1)} · {count}{" "}
            {count === 1 ? t("feedback.count.one") : t("feedback.count.other")}
          </span>
        </div>
      )}

      {comments.length > 0 && (
        <ul className="mt-6 flex flex-col gap-4">
          {comments.map((f) => (
            <li key={f.id} className="rounded-xl border bg-card/60 p-4">
              <Stars value={f.rating} size="size-3.5" />
              <p className="mt-2 text-sm leading-relaxed">{f.comment}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 max-w-md rounded-2xl border p-5">
        {justSubmitted ? (
          <p className="text-sm text-muted-foreground">{t("feedback.thanks")}</p>
        ) : (
          <form action={action} className="flex flex-col gap-3">
            {lang && <input type="hidden" name="lang" value={lang} />}
            <p className="text-sm font-medium">{t("feedback.ratingLabel")}</p>
            <div
              className="flex items-center gap-1"
              onMouseLeave={() => setHoverRating(0)}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i)}
                  onMouseEnter={() => setHoverRating(i)}
                  className="text-primary"
                  aria-label={`${i} / 5`}
                >
                  <Star
                    aria-hidden="true"
                    className="size-6"
                    fill={i <= (hoverRating || rating) ? "currentColor" : "none"}
                  />
                </button>
              ))}
              <input type="hidden" name="rating" value={rating} />
            </div>
            <Textarea
              name="comment"
              placeholder={t("feedback.commentPlaceholder")}
              rows={3}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={rating === 0} className="self-start">
              {t("feedback.submit")}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
