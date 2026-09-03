import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { DESTINATIONS, getDestination } from "@/lib/destinations";

export function generateStaticParams() {
  return DESTINATIONS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const d = getDestination(slug);
  if (!d) return { title: "Guide — Wander" };
  return {
    title: `${d.city} guide — Wander`,
    description: `A Wander field guide to ${d.city}. ${d.blurb}`,
  };
}

export default async function DestinationGuide({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const d = getDestination(slug);
  if (!d) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/#destinations"
        className="font-[var(--font-mono)] text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:text-foreground"
      >
        ← Featured destinations
      </Link>

      <div className="relative mt-6 aspect-[21/10] overflow-hidden rounded-[26px]">
        <Image
          src={d.img}
          alt={d.name}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(11,20,24,0.72) 0%, rgba(11,20,24,0.1) 55%, transparent 100%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 p-6">
          <span className="font-[var(--font-mono)] text-[0.62rem] uppercase tracking-[0.22em] text-white/75">
            Wander Journal · {d.region}
          </span>
          <h1 className="mt-1 font-[var(--font-display)] text-[clamp(2rem,5vw,3rem)] font-semibold leading-tight tracking-tight text-white">
            {d.city}
          </h1>
        </div>
      </div>

      <div className="glass mt-8 rounded-[22px] p-6">
        <p className="font-[var(--font-mono)] text-xs uppercase tracking-[0.16em] text-[var(--lake)]">
          Guide coming soon
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-foreground">
          We&apos;re writing this one. A hands-on {d.city} guide — where to base
          yourself, the walks worth doing, what to eat, and what&apos;s fine to
          skip — is on the way.
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          In the meantime, let Wander draft you a day-by-day itinerary and shape
          it from there.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <ButtonLink href={`/trips/new?to=${encodeURIComponent(d.name)}`} arrow>
          Plan a trip to {d.city}
        </ButtonLink>
        <Link
          href="/#destinations"
          className="font-[var(--font-mono)] text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:text-foreground"
        >
          Other destinations
        </Link>
      </div>
    </main>
  );
}
