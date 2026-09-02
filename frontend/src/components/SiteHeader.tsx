"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Compass } from "@/components/brand/Compass";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { createClient } from "@/lib/supabase/client";

const SECTIONS = [
  { href: "/", label: "Home" },
  { href: "/#how", label: "How it works" },
  { href: "/#destinations", label: "Destinations" },
];

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const onLanding = pathname === "/";
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

  return (
    <header className="sticky top-0 z-30 px-4 pt-3 print:hidden">
      <nav
        className={`glass-nav mx-auto flex max-w-6xl items-center justify-between rounded-full px-4 py-2.5 text-sm transition-shadow duration-300 ${
          scrolled ? "shadow-[0_12px_32px_-18px_rgba(23,60,82,0.3)]" : ""
        }`}
      >
        <Link
          href="/"
          className="flex items-center gap-2 pr-3 font-[var(--font-display)] text-base tracking-tight"
        >
          <Compass size={26} />
          <span className="font-semibold">Wander</span>
        </Link>

        {onLanding && (
          <div className="hidden items-center gap-1 md:flex">
            {SECTIONS.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="rounded-full px-3 py-1.5 text-muted transition-colors hover:text-foreground"
              >
                {s.label}
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1">
          {(!onLanding || (ready && email)) && (
            <Link
              href="/trips"
              className="rounded-full px-3 py-1.5 text-muted transition-colors hover:text-foreground"
            >
              My trips
            </Link>
          )}
          {ready && email ? (
            <button
              onClick={signOut}
              className="rounded-full px-3 py-1.5 text-muted transition-colors hover:text-foreground"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-[var(--lake)] px-4 py-1.5 font-medium text-white transition-colors hover:bg-[var(--lake-hover)]"
            >
              Sign in
            </Link>
          )}
          <span className="mx-1 hidden h-4 w-px bg-border sm:block" />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
