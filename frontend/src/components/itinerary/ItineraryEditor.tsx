"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ItinerarySkeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { tripCache } from "@/lib/tripCache";
import { CostSummary } from "./CostSummary";
import { DaySection } from "./DaySection";

export function ItineraryEditor({ tripId }: { tripId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: trip, isLoading, error } = useQuery({
    queryKey: tripCache.key(tripId),
    queryFn: () => api.getTrip(tripId),
  });

  const regenerate = useMutation({
    mutationFn: () => api.generate(tripId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: tripCache.key(tripId) }),
  });

  const remove = useMutation({
    mutationFn: () => api.deleteTrip(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      router.push("/trips");
    },
  });

  if (isLoading)
    return (
      <main className="mx-auto max-w-3xl px-6 py-14 md:pl-24">
        <ItinerarySkeleton />
      </main>
    );

  if (error || !trip)
    return (
      <main className="mx-auto max-w-3xl px-6 py-14 md:pl-24">
        <p className="text-sm text-[var(--danger)]">Could not load this trip.</p>
        <Link
          href="/trips"
          className="mt-2 inline-block font-[var(--font-mono)] text-xs uppercase tracking-[0.14em] text-[var(--lake)]"
        >
          ← My trips
        </Link>
      </main>
    );

  const estTotal = trip.days.reduce(
    (sum, day) => sum + day.items.reduce((s, i) => s + (i.est_cost ?? 0), 0),
    0,
  );
  const budget = trip.budget_total;
  const pct = budget ? Math.min(100, Math.round((estTotal / budget) * 100)) : 0;
  const over = budget != null && estTotal > budget;

  return (
    <main className="mx-auto max-w-3xl px-6 py-14 md:pl-24">
      <Link
        href="/trips"
        className="font-[var(--font-mono)] text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:text-foreground print:hidden"
      >
        ← My trips
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-[var(--font-display)] text-[clamp(2rem,5vw,3rem)] font-normal leading-tight tracking-tight">
            {trip.destination}
          </h1>
          <p className="mt-2 font-[var(--font-mono)] text-xs uppercase tracking-[0.12em] text-muted">
            {trip.start_date} → {trip.end_date} · {trip.num_travelers} traveller
            {trip.num_travelers > 1 ? "s" : ""} · {trip.travel_style} · {trip.pace}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button variant="ghost" size="sm" onClick={() => window.print()}>
            Print
          </Button>
          <ButtonLink href={`/trips/${tripId}/edit`} variant="secondary" size="sm">
            Edit details
          </ButtonLink>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => regenerate.mutate()}
            disabled={regenerate.isPending}
          >
            {regenerate.isPending ? "Regenerating…" : "Regenerate"}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (confirm("Delete this trip? This cannot be undone.")) remove.mutate();
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Budget — elevation line */}
      <div className="glass mt-6 rounded-[20px] p-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-[var(--font-mono)] text-xs uppercase tracking-[0.14em] text-muted">
            Estimated cost
          </span>
          <span
            className={`font-[var(--font-mono)] ${over ? "text-[var(--danger)]" : ""}`}
          >
            {trip.currency} {estTotal.toFixed(0)}
            {budget != null && (
              <span className="text-muted"> / {budget}</span>
            )}
          </span>
        </div>
        {budget != null && (
          <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-surface-2">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                over ? "bg-[var(--danger)]" : "bg-[var(--lake)]"
              }`}
              style={{ width: `${Math.max(pct, 2)}%` }}
            />
          </div>
        )}
      </div>

      {trip.notes && (
        <div className="glass mt-3 rounded-[20px] p-4">
          <p className="font-[var(--font-mono)] text-xs uppercase tracking-[0.14em] text-muted">
            Your notes
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
            {trip.notes}
          </p>
        </div>
      )}

      {trip.days.length > 0 && (
        <div className="mt-3">
          <CostSummary trip={trip} />
        </div>
      )}

      {trip.days.length > 1 && (
        <nav className="mt-5 flex flex-wrap gap-2 print:hidden">
          {trip.days.map((d) => (
            <a
              key={d.id}
              href={`#day-${d.day_index}`}
              className="rounded-full border border-border px-3 py-1 font-[var(--font-mono)] text-[0.7rem] uppercase tracking-[0.12em] text-muted transition-colors hover:border-[var(--lake)] hover:text-foreground"
            >
              Day {d.day_index}
            </a>
          ))}
        </nav>
      )}

      {regenerate.isError && (
        <p className="mt-4 text-sm text-[var(--danger)]">
          Generation failed: {(regenerate.error as Error).message}
        </p>
      )}

      <div className="mt-10 space-y-12">
        {trip.days.map((day) => (
          <DaySection
            key={day.id}
            day={day}
            tripId={tripId}
            currency={trip.currency}
            destination={trip.destination}
          />
        ))}
        {trip.days.length === 0 && (
          <div className="glass rounded-[24px] p-10 text-center text-sm text-muted">
            No itinerary yet.
            <div className="mt-4">
              <Button
                onClick={() => regenerate.mutate()}
                disabled={regenerate.isPending}
                arrow={!regenerate.isPending}
              >
                {regenerate.isPending ? "Drawing your route…" : "Generate itinerary"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
