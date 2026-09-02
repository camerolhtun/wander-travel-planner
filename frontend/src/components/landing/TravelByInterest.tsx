"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { Reveal } from "@/components/ui/Reveal";

const INTERESTS = [
  { name: "Beach", img: "/int-beach.jpg", count: 24, icon: "◐" },
  { name: "Mountain", img: "/int-mountain.jpg", count: 18, icon: "▲" },
  { name: "Culture", img: "/int-culture.jpg", count: 32, icon: "◆" },
];

export function TravelByInterest() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const card = el.firstElementChild as HTMLElement | null;
      if (!card) return;
      const w = card.offsetWidth + 24; // card + gap
      setIndex(Math.round(el.scrollLeft / w));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  function scrollBy(dir: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = (card?.offsetWidth ?? el.clientWidth * 0.8) + 24;
    el.scrollBy({
      left: dir * step,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }

  return (
    <section className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal className="text-center">
          <h2 className="font-[var(--font-display)] text-[clamp(2rem,4.5vw,3.25rem)] font-semibold tracking-tight">
            Travel by interest
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted">
            Discover destinations tailored to your passions.
          </p>
        </Reveal>

        <div className="relative mt-14">
          <div
            ref={trackRef}
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {INTERESTS.map((it) => (
              <Link
                key={it.name}
                href="/trips/new"
                className="group relative aspect-[4/3] w-[86%] shrink-0 snap-start overflow-hidden rounded-[24px] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
              >
                <Image
                  src={it.img}
                  alt={it.name}
                  fill
                  sizes="(max-width: 640px) 86vw, (max-width: 1024px) 46vw, 31vw"
                  className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                />
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(11,20,24,0.78) 0%, rgba(11,20,24,0.12) 55%, transparent 100%)",
                  }}
                />
                <span className="glass absolute left-4 top-4 grid size-10 place-items-center rounded-full text-lg text-white">
                  {it.icon}
                </span>
                <div className="absolute inset-x-5 bottom-5 text-white">
                  <h3 className="font-[var(--font-display)] text-2xl font-semibold">
                    {it.name}
                  </h3>
                  <p className="mt-1 font-[var(--font-mono)] text-xs uppercase tracking-[0.12em] text-white/75">
                    {it.count} destinations
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 font-[var(--font-mono)] text-xs uppercase tracking-[0.12em] transition-transform duration-200 group-hover:translate-x-0.5">
                    Explore →
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={() => scrollBy(-1)}
              aria-label="Previous"
              className="grid size-9 place-items-center rounded-full border border-border text-muted transition-colors hover:text-foreground"
            >
              ←
            </button>
            <div className="flex gap-1.5">
              {INTERESTS.map((it, i) => (
                <span
                  key={it.name}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-6 bg-[var(--lake)]" : "w-1.5 bg-border"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => scrollBy(1)}
              aria-label="Next"
              className="grid size-9 place-items-center rounded-full border border-border text-muted transition-colors hover:text-foreground"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
