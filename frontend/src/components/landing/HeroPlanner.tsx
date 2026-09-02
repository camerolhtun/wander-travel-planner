"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function HeroPlanner() {
  const router = useRouter();
  const [to, setTo] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams();
    if (to.trim()) q.set("to", to.trim());
    if (start) q.set("start", start);
    if (end) q.set("end", end);
    const qs = q.toString();
    router.push(qs ? `/trips/new?${qs}` : "/trips/new");
  }

  return (
    <section className="relative isolate flex min-h-[86svh] flex-col justify-start overflow-hidden">
      {/* Full-bleed photo */}
      <Image
        src="/hero-fuji.jpg"
        alt="Mount Fuji framed by cherry blossom in spring"
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover object-[50%_42%]"
      />
      {/* Pearl wash — heavier on the left where the copy sits, melts to page at the base */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(102deg, color-mix(in oklab, var(--background) 82%, transparent) 0%, color-mix(in oklab, var(--background) 58%, transparent) 42%, color-mix(in oklab, var(--background) 34%, transparent) 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-20"
        style={{ background: "linear-gradient(to bottom, var(--background), transparent)" }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-40"
        style={{ background: "linear-gradient(to top, var(--background), transparent)" }}
      />

      <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-[17vh] md:pl-24">
        <p className="eyebrow rise" style={{ animationDelay: "0ms" }}>
          Wander — AI itinerary planner
        </p>

        <h1 className="mt-6 font-[var(--font-display)] text-[clamp(2.6rem,7.4vw,5.5rem)] font-normal leading-[0.98] tracking-[-0.035em] text-foreground">
          <span className="rise block" style={{ animationDelay: "80ms" }}>
            Plan a trip
          </span>
          <span className="rise block" style={{ animationDelay: "200ms" }}>
            in a{" "}
            <span className="relative inline-block text-[var(--lake)]">
              minute.
              <svg
                className="hero-underline absolute -bottom-1 left-0 w-full"
                height="10"
                viewBox="0 0 200 10"
                preserveAspectRatio="none"
                fill="none"
              >
                <path
                  d="M2 6 C 40 2, 70 9, 110 5 S 180 2, 198 6"
                  stroke="var(--sky)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  pathLength={1}
                />
              </svg>
            </span>
          </span>
        </h1>

        <p
          className="rise mt-4 font-[var(--font-mono)] text-sm uppercase tracking-[0.18em] text-muted"
          style={{ animationDelay: "300ms" }}
        >
          — not an afternoon
        </p>

        {/* Liquid-glass search widget */}
        <form
          onSubmit={submit}
          className="glass-search rise mt-7 flex max-w-xl flex-col gap-0.5 rounded-[20px] p-1.5 sm:flex-row sm:items-stretch"
          style={{ animationDelay: "420ms" }}
        >
          <label className="flex flex-1 flex-col gap-0.5 rounded-[14px] px-3.5 py-2 transition-colors hover:bg-white/25">
            <span className="font-[var(--font-mono)] text-[0.6rem] uppercase tracking-[0.16em] text-muted">
              Where to?
            </span>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Kyoto, Japan"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted/70"
            />
          </label>

          <span className="mx-0.5 hidden w-px bg-border sm:block" />

          <label className="flex flex-col gap-0.5 rounded-[14px] px-3.5 py-2 transition-colors hover:bg-white/25">
            <span className="font-[var(--font-mono)] text-[0.6rem] uppercase tracking-[0.16em] text-muted">
              From
            </span>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="bg-transparent text-sm outline-none [color-scheme:light]"
            />
          </label>

          <span className="mx-0.5 hidden w-px bg-border sm:block" />

          <label className="flex flex-col gap-0.5 rounded-[14px] px-3.5 py-2 transition-colors hover:bg-white/25">
            <span className="font-[var(--font-mono)] text-[0.6rem] uppercase tracking-[0.16em] text-muted">
              To
            </span>
            <input
              type="date"
              value={end}
              min={start || undefined}
              onChange={(e) => setEnd(e.target.value)}
              className="bg-transparent text-sm outline-none [color-scheme:light]"
            />
          </label>

          <button
            type="submit"
            className="group/go m-0.5 flex shrink-0 items-center justify-center gap-1.5 rounded-[14px] bg-[var(--lake-hover)] px-4 py-2.5 font-[var(--font-mono)] text-[0.68rem] uppercase tracking-[0.14em] text-white transition-colors hover:bg-[var(--lake-deep)]"
          >
            Plan a trip
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/go:translate-x-0.5"
            >
              <path
                d="M3 8h9M8 3l5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>

        <p
          className="rise mt-3 font-[var(--font-mono)] text-xs text-muted"
          style={{ animationDelay: "540ms" }}
        >
          Dates optional — add them later.
        </p>
      </div>
    </section>
  );
}
