import { Reveal } from "@/components/ui/Reveal";

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

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal className="text-center">
          <h2 className="font-[var(--font-display)] text-[clamp(2rem,4.5vw,3.25rem)] font-semibold tracking-tight">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted">
            Three simple steps to your perfect journey.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal
              key={s.n}
              delay={i * 90}
              className="rounded-[24px] border border-border bg-surface p-8 text-center shadow-[var(--shadow-soft)]"
            >
              <div className="font-[var(--font-mono)] text-5xl font-medium text-[var(--lake)]">
                {s.n}
              </div>
              <h3 className="mt-5 font-[var(--font-display)] text-xl font-semibold">
                {s.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
