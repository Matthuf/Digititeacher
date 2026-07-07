import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { signOut } from "@/app/studio/actions";
import { Button } from "@/components/ui/button";

export default function StudioProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/studio" className="text-lg font-semibold">
            Studio
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/">
                <ExternalLink aria-hidden="true" className="size-4" />
                Zur Website
              </Link>
            </Button>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                Abmelden
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
