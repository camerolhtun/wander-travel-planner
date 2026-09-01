"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Compass } from "@/components/brand/Compass";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { createClient } from "@/lib/supabase/client";

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        setEmail(data.user?.email ?? null);
        setReady(true);
      });
      const { data } = supabase.auth.onAuthStateChange((_e, session) => {
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
      /* ignore */
    }
    setEmail(null);
    router.push("/");
    router.refresh();
  }

  function navLink(href: string, label: string) {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        href={href}
        className={`rounded-full px-3 py-1.5 transition-colors ${
          active ? "text-foreground" : "text-muted hover:text-foreground"
        }`}
      >
        {label}
      </Link>
    );
  }

  return (
    <header className="sticky top-0 z-30 px-4 pt-3 print:hidden">
      <nav
        className={`mx-auto flex max-w-5xl items-center justify-between rounded-full px-3 py-2 text-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          scrolled ? "glass" : "border border-transparent"
        }`}
      >
        <Link
          href="/"
          className="flex items-center gap-2 pl-1 pr-3 font-[var(--font-display)] text-base tracking-tight"
        >
          <Compass size={26} />
          <span className="font-medium">Wander</span>
        </Link>

        <div className="flex items-center gap-1">
          {navLink("/trips", "My trips")}
          {ready && email ? (
            <>
              <span className="mx-1 hidden max-w-[16ch] truncate font-[var(--font-mono)] text-xs text-muted sm:inline">
                {email}
              </span>
              <button
                onClick={signOut}
                className="rounded-full px-3 py-1.5 text-muted transition-colors hover:text-foreground"
              >
                Sign out
              </button>
            </>
          ) : (
            navLink("/login", "Sign in")
          )}
          <span className="mx-1 hidden h-4 w-px bg-border sm:block" />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
