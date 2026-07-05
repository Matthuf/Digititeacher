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

  return <div className="flex flex-1 flex-col">{children}</div>;
}
