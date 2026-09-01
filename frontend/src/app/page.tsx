import { ButtonLink } from "@/components/ui/Button";

const STEPS = [
  {
    icon: "📝",
    title: "Tell us the basics",
    body: "Destination, dates, budget, travellers, interests, style, and pace.",
  },
  {
    icon: "✨",
    title: "Generate a plan",
    body: "A day-by-day itinerary with attractions, food, timings, and daily budgets.",
  },
  {
    icon: "✏️",
    title: "Make it yours",
    body: "Edit any stop, reorder the day, add your own spots, and save the trip.",
  },
];

export default function Home() {
  return (
    <main>
      <section className="mx-auto max-w-4xl px-5 py-20 sm:py-28">
        <p className="mb-3 text-sm font-medium text-primary">AI Travel Itinerary Planner</p>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Plan a trip in a minute, not an afternoon.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          Enter where you&apos;re going and what you like. Get a realistic day-by-day
          itinerary with an estimated daily budget — then edit every detail.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/trips/new">Plan a trip</ButtonLink>
          <ButtonLink href="/trips" variant="secondary">
            My trips
          </ButtonLink>
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-4xl gap-6 px-5 py-14 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.title} className="space-y-2">
              <div className="text-2xl" aria-hidden>
                {s.icon}
              </div>
              <h2 className="font-semibold">{s.title}</h2>
              <p className="text-sm text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
