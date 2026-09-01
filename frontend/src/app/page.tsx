import { HeroPlanner } from "@/components/landing/HeroPlanner";
import { ButtonLink } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Reveal } from "@/components/ui/Reveal";
import { CATEGORY_META } from "@/lib/categories";

const STEPS = [
  {
    n: "01",
    title: "Tell us the basics",
    body: "Destination, dates, budget, who's going, and the kind of trip you want.",
  },
  {
    n: "02",
    title: "Wander draws the route",
    body: "A day-by-day plan — attractions, food, timings, and an estimated daily spend.",
  },
  {
    n: "03",
    title: "Make it yours",
    body: "Edit any stop, reorder the day, add your own places, regenerate what you don't like.",
  },
];

const SPECIMEN = [
  { cat: "food" as const, time: "09:00", title: "Coffee at A Brasileira", cost: 6 },
  { cat: "attraction" as const, time: "10:30", title: "Tram 28 to Alfama", cost: 3 },
  { cat: "activity" as const, time: "12:00", title: "Miradouro walk", cost: 0 },
];

export default function Home() {
  return (
    <main>
      <HeroPlanner />

      {/* How it works — an honest three-step sequence */}
      <section className="mx-auto max-w-5xl px-6 py-24 md:pl-24">
        <Reveal>
          <p className="eyebrow">How it works</p>
        </Reveal>
        <div className="mt-10 space-y-px">
          {STEPS.map((s, i) => (
            <Reveal
              key={s.n}
              delay={i * 90}
              className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-border py-8 sm:grid-cols-[6rem_1fr]"
            >
              <span className="font-[var(--font-mono)] text-sm text-[var(--lake)]">
                {s.n}
              </span>
              <div>
                <h2 className="font-[var(--font-display)] text-2xl sm:text-3xl">
                  {s.title}
                </h2>
                <p className="mt-2 max-w-md text-muted">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Specimen — the real product, in miniature */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:pl-24">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <Reveal>
            <p className="eyebrow">A morning in Lisbon</p>
            <h2 className="mt-5 font-[var(--font-display)] text-3xl sm:text-4xl">
              Every trip is a route with stops in order.
            </h2>
            <p className="mt-4 max-w-sm text-muted">
              Wander lays the day out on a timeline. Times and costs sit in the
              margin so you can see the shape of it at a glance.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <GlassCard className="p-5">
              <div className="flex items-baseline justify-between font-[var(--font-mono)] text-xs uppercase tracking-[0.16em] text-muted">
                <span>Day 01 · Lisbon</span>
                <span>≈ €9</span>
              </div>
              <ul className="mt-4 space-y-3 border-l border-border pl-4">
                {SPECIMEN.map((it) => {
                  const meta = CATEGORY_META[it.cat];
                  return (
                    <li key={it.title} className="relative">
                      <span className="absolute -left-[1.05rem] top-1.5 size-2 rounded-full bg-[var(--lake)] ring-4 ring-[var(--background)]" />
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${meta.badge}`}
                        >
                          {meta.icon} {meta.label}
                        </span>
                        <span className="font-[var(--font-mono)] text-xs text-muted">
                          {it.time}
                        </span>
                        <span className="ml-auto font-[var(--font-mono)] text-xs text-muted">
                          {it.cost ? `€${it.cost}` : "free"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm">{it.title}</p>
                    </li>
                  );
                })}
              </ul>
            </GlassCard>
          </Reveal>
        </div>
      </section>

      {/* Closing */}
      <section className="mx-auto max-w-5xl px-6 py-28 text-center md:pl-24">
        <Reveal>
          <p className="eyebrow">You&apos;re here</p>
          <h2 className="mx-auto mt-6 max-w-[14ch] font-[var(--font-display)] text-[clamp(2.6rem,8vw,5.5rem)] font-normal leading-[0.95] tracking-[-0.03em]">
            Start wandering.
          </h2>
          <div className="mt-10 flex justify-center">
            <ButtonLink href="/trips/new" size="md" arrow>
              Plan a trip
            </ButtonLink>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
