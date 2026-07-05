import Link from "next/link";
import { signOut } from "@/app/studio/actions";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-xl font-semibold">Supabase ist noch nicht konfiguriert</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Trage NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY in
          deiner .env.local ein, um das Studio (Login, Touren, Stationen) zu
          nutzen.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/studio" className="text-lg font-semibold">
            Studio
          </Link>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Abmelden
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
