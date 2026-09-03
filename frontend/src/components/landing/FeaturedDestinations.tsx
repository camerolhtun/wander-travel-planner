import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { DESTINATIONS } from "@/lib/destinations";

function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 14s5-4.5 5-8A5 5 0 0 0 3 6c0 3.5 5 8 5 8Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="8" cy="6" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function FeaturedDestinations() {
  return (
    <section
      id="destinations"
      className="scroll-mt-24 border-t border-border bg-surface-2 px-6 py-24"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal className="text-center">
          <h2 className="font-[var(--font-display)] text-[clamp(2rem,4.5vw,3.25rem)] font-semibold tracking-tight">
            Featured destinations
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted">
            Handpicked journeys to the world&apos;s most captivating places.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {DESTINATIONS.map((d, i) => (
            <Reveal key={d.slug} delay={i * 90}>
              <Link
                href={`/blog/${d.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-border bg-surface shadow-[var(--shadow-soft)] transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={d.img}
                    alt={d.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-[var(--surface)]/95 px-2.5 py-1 font-[var(--font-mono)] text-[0.62rem] uppercase tracking-[0.12em] text-foreground">
                    {d.tag}
                  </span>
                  <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-[var(--surface)]/95 px-2.5 py-1 font-[var(--font-mono)] text-[0.62rem] uppercase tracking-[0.1em] text-[var(--lake)]">
                    {d.days} days
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-[var(--font-display)] text-lg font-semibold group-hover:text-[var(--lake)]">
                    {d.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                    {d.blurb}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 font-[var(--font-mono)] text-[0.7rem] uppercase tracking-[0.1em]">
                    <span className="flex items-center gap-1.5 text-[var(--lake)]">
                      <PinIcon />
                      {d.region}
                    </span>
                    <span className="flex items-center gap-1 text-[var(--lake)] transition-transform duration-200 group-hover:translate-x-0.5">
                      Read the guide →
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <ButtonLink href="/trips/new" arrow>
            Plan your own trip
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
