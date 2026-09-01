"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ContourField } from "@/components/landing/ContourField";

export function HeroPlanner() {
  const router = useRouter();
  const [to, setTo] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = to.trim();
    router.push(q ? `/trips/new?to=${encodeURIComponent(q)}` : "/trips/new");
  }

  return (
    <section className="relative overflow-hidden">
      <ContourField />
      <div className="mx-auto flex min-h-[calc(100svh-5rem)] max-w-5xl flex-col justify-center px-6 py-16 md:pl-24">
        <p className="eyebrow rise" style={{ animationDelay: "0ms" }}>
          Wander — AI itinerary planner
        </p>

        <h1 className="mt-6 font-[var(--font-display)] text-[clamp(2.6rem,8vw,5.75rem)] font-normal leading-[0.98] tracking-[-0.035em]">
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
          style={{ animationDelay: "320ms" }}
        >
          — not an afternoon
        </p>

        <p
          className="rise mt-8 max-w-md text-lg leading-relaxed text-muted"
          style={{ animationDelay: "440ms" }}
        >
          Tell Wander where you&apos;re going and what you like. It draws a
          day-by-day route with times and a daily budget — yours to edit.
        </p>

        <form
          onSubmit={submit}
          className="rise glass mt-9 flex max-w-md items-center gap-2 rounded-full p-2 pl-5"
          style={{ animationDelay: "560ms" }}
        >
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Where to?"
            aria-label="Destination"
            className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            className="group/go grid size-11 shrink-0 place-items-center rounded-full bg-[var(--lake)] text-white transition-colors hover:bg-[var(--lake-hover)]"
            aria-label="Start planning"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/go:translate-x-0.5"
            >
              <path
                d="M3 8h9M8 3l5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>

        <p
          className="rise mt-4 font-[var(--font-mono)] text-xs text-muted"
          style={{ animationDelay: "660ms" }}
        >
          e.g. Kyoto · Lisbon · Patagonia
        </p>
      </div>
    </section>
  );
}
