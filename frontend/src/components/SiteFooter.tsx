import Link from "next/link";
import { Compass } from "@/components/brand/Compass";

const LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/#destinations", label: "Destinations" },
  { href: "/trips", label: "My trips" },
  { href: "/login", label: "Sign in" },
];

export function SiteFooter() {
  return (
    <footer className="bg-[#101a1f] text-[#e7eef2] print:hidden">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Compass size={22} />
          <span className="font-[var(--font-display)] font-semibold">Wander</span>
          <span className="ml-2 font-[var(--font-mono)] text-xs text-white/50">
            © 2026
          </span>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-white/65 transition-colors hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
