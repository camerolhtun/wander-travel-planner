import { Compass } from "@/components/brand/Compass";

export function SiteFooter() {
  return (
    <footer className="relative z-[1] mt-24 border-t border-border print:hidden">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Compass size={22} />
          <span className="font-[var(--font-display)] font-medium">Wander</span>
        </div>
        <p className="font-[var(--font-mono)] text-[0.7rem] uppercase tracking-[0.18em] text-muted">
          46.8182&deg; N · 8.2275&deg; E — built with Next.js, FastAPI, Supabase &amp;
          Gemini
        </p>
      </div>
    </footer>
  );
}
