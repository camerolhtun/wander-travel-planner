"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CitySuggest } from "@/components/ui/CitySuggest";
import { DateRangeField } from "@/components/ui/DateRangeField";

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
    <section className="relative isolate flex min-h-[88svh] flex-col justify-end overflow-hidden">
      <Image
        src="/hero-fuji.jpg"
        alt="Mount Fuji framed by cherry blossom in spring"
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover object-[50%_45%]"
      />
      {/* Legibility gradients — dark at the base + left for the copy */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(to top, rgba(11,20,24,0.7) 0%, rgba(11,20,24,0.28) 42%, rgba(11,20,24,0) 72%), linear-gradient(100deg, rgba(11,20,24,0.5) 0%, rgba(11,20,24,0.12) 44%, transparent 62%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-24"
        style={{ background: "linear-gradient(to top, var(--background), transparent)" }}
      />

      <div className="mx-auto w-full max-w-6xl px-6 pb-14 pt-28 sm:pt-40 md:pb-20">
        <span className="rise inline-block rounded-full border border-white/25 bg-white/10 px-3 py-1 font-[var(--font-mono)] text-[0.62rem] uppercase tracking-[0.22em] text-white/85 backdrop-blur-sm">
          Wander — AI itinerary planner
        </span>

        <h1 className="mt-6 max-w-[16ch] font-[var(--font-display)] text-[clamp(2.9rem,8vw,6rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-white [text-wrap:balance]">
          <span className="rise block" style={{ animationDelay: "80ms" }}>
            Plan a trip
          </span>
          <span className="rise block" style={{ animationDelay: "180ms" }}>
            in a{" "}
            <span className="relative inline-block">
              minute
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
            .
          </span>
        </h1>

        <p
          className="rise mt-6 max-w-lg text-lg leading-relaxed text-white/85"
          style={{ animationDelay: "300ms" }}
        >
          Tell Wander where you&apos;re going and what you like. It draws a
          day-by-day route with times and an estimated daily budget — every stop
          yours to edit.
        </p>

        {/* Dark liquid-glass search widget */}
        <form
          onSubmit={submit}
          className="glass-dark rise relative z-10 mt-9 flex max-w-2xl flex-col gap-0.5 rounded-[22px] p-1.5 sm:flex-row sm:items-stretch"
          style={{ animationDelay: "420ms" }}
        >
          <label className="flex flex-1 flex-col gap-0.5 rounded-[16px] px-4 py-2.5 transition-colors hover:bg-white/10">
            <span className="font-[var(--font-mono)] text-[0.6rem] uppercase tracking-[0.16em] text-white/60">
              Where to?
            </span>
            <CitySuggest
              value={to}
              onChange={setTo}
              inputClassName="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/45"
            />
          </label>

          <span className="mx-1 hidden w-px bg-white/15 sm:block" />

          <DateRangeField
            start={start}
            end={end}
            onChange={(s, e) => {
              setStart(s);
              setEnd(e);
            }}
            labelClass="font-[var(--font-mono)] text-[0.6rem] uppercase tracking-[0.16em] text-white/60"
            fieldClass="text-sm text-white"
          />

          <span className="mx-1 hidden w-px bg-white/15 sm:block" />

          <button
            type="submit"
            className="group/go m-0.5 flex shrink-0 items-center justify-center gap-1.5 rounded-[16px] bg-[var(--lake)] px-5 py-3 font-[var(--font-mono)] text-[0.68rem] uppercase tracking-[0.14em] text-white transition-colors hover:bg-[var(--lake-hover)]"
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
      </div>
    </section>
  );
}
