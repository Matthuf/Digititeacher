"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteStationQuiz, upsertStationQuiz } from "@/app/studio/actions";
import type { StationQuiz } from "@/lib/tours";

export function StationQuizEditor({
  tourId,
  stationId,
  quiz,
}: {
  tourId: string;
  stationId: string;
  quiz: StationQuiz | null;
}) {
  const [correctIndex, setCorrectIndex] = useState(quiz?.correct_index ?? 0);
  const options = quiz?.options ?? [];
  const action = upsertStationQuiz.bind(null, tourId, stationId);

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`quiz-question-${stationId}`}>Frage</Label>
        <Textarea
          id={`quiz-question-${stationId}`}
          name="question"
          defaultValue={quiz?.question ?? ""}
          rows={2}
          placeholder="z. B. Wie heisst der höchste Gipfel in dieser Region?"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Antwortmöglichkeiten (mind. 2, richtige markieren)</Label>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name="correct_index"
              value={i}
              checked={correctIndex === i}
              onChange={() => setCorrectIndex(i)}
              aria-label={`Option ${i + 1} ist richtig`}
              className="size-4 accent-primary"
            />
            <Input
              name={`option-${i}`}
              defaultValue={options[i] ?? ""}
              placeholder={`Option ${i + 1}`}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" className="self-start">
          Quiz speichern
        </Button>
        {quiz && (
          <Button
            type="submit"
            formAction={deleteStationQuiz.bind(null, tourId, stationId)}
            variant="ghost"
            size="sm"
          >
            Quiz entfernen
          </Button>
        )}
      </div>
    </form>
  );
}
