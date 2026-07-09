import { createTour } from "@/app/studio/actions";
import { GENRE_KEYS, GENRES } from "@/lib/genres";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewTourPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Neue Tour anlegen</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTour} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Titel</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Beschreibung</Label>
              <Input id="description" name="description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="region">Region</Label>
                <Input id="region" name="region" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="duration_minutes">Dauer (Min.)</Label>
                <Input id="duration_minutes" name="duration_minutes" type="number" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="difficulty">Schwierigkeit</Label>
                <Input id="difficulty" name="difficulty" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="price">Preis (CHF, leer = kostenlos)</Label>
                <Input id="price" name="price" type="number" step="0.05" min="0" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="genre">Erlebnis-Genre</Label>
              <select
                id="genre"
                name="genre"
                defaultValue=""
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">– Kein Genre –</option>
                {GENRE_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {GENRES[key].label}
                  </option>
                ))}
              </select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="mt-2">
              Tour anlegen
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
