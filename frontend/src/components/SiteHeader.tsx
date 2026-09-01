"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { createClient } from "@/lib/supabase/client";

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        setEmail(data.user?.email ?? null);
        setReady(true);
      });
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setEmail(session?.user?.email ?? null);
      });
      unsub = () => data.subscription.unsubscribe();
    } catch {
      setReady(true);
    }
    return () => unsub?.();
  }, []);

  async function signOut() {
    try {
      await createClient().auth.signOut();
    } catch {
      // ignore
    }
    setEmail(null);
    router.push("/");
    router.refresh();
  }

  const navLink = (href: string, label: string) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        href={href}
        className={`rounded-md px-2 py-1 transition-colors hover:bg-surface-2 ${
          active ? "text-foreground" : "text-muted"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur print:hidden">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3 text-sm">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span aria-hidden>🧭</span> Wander
        </Link>
        <div className="flex items-center gap-1">
          {navLink("/trips", "My trips")}
          {ready && email ? (
            <>
              <span className="mx-1 hidden max-w-[14ch] truncate text-muted sm:inline">
                {email}
              </span>
              <button
                onClick={signOut}
                className="rounded-md px-2 py-1 text-muted transition-colors hover:bg-surface-2"
              >
                Sign out
              </button>
            </>
          ) : (
            navLink("/login", "Sign in")
          )}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
