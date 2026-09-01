"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ItinerarySkeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { tripCache } from "@/lib/tripCache";
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
      <main className="mx-auto max-w-3xl px-5 py-10">
        <ItinerarySkeleton />
      </main>
    );

  if (error || !trip)
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-sm text-danger">Could not load this trip.</p>
        <Link href="/trips" className="mt-2 inline-block text-sm text-primary">
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
    <main className="mx-auto max-w-3xl px-5 py-10">
      <Link href="/trips" className="text-sm text-muted hover:text-foreground">
        ← My trips
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{trip.destination}</h1>
          <p className="mt-1 text-sm text-muted">
            {trip.start_date} → {trip.end_date} · {trip.num_travelers} traveller
            {trip.num_travelers > 1 ? "s" : ""} · {trip.travel_style} · {trip.pace} pace
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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

      {/* Budget bar */}
      <div className="mt-5 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-muted">Estimated cost</span>
          <span className={over ? "font-semibold text-danger" : "font-semibold"}>
            {trip.currency} {estTotal.toFixed(0)}
            {budget != null && (
              <span className="font-normal text-muted"> of {budget}</span>
            )}
          </span>
        </div>
        {budget != null && (
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className={`h-full rounded-full ${over ? "bg-danger" : "bg-primary"}`}
              style={{ width: `${Math.max(pct, 2)}%` }}
            />
          </div>
        )}
      </div>

      {trip.days.length > 1 && (
        <nav className="mt-4 flex flex-wrap gap-2 text-sm">
          {trip.days.map((d) => (
            <a
              key={d.id}
              href={`#day-${d.day_index}`}
              className="rounded-full border border-border px-3 py-1 text-muted hover:text-foreground"
            >
              Day {d.day_index}
            </a>
          ))}
        </nav>
      )}

      {regenerate.isError && (
        <p className="mt-4 text-sm text-danger">
          Generation failed: {(regenerate.error as Error).message}
        </p>
      )}

      <div className="mt-8 space-y-10">
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
          <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
            No itinerary yet.
            <div className="mt-3">
              <Button onClick={() => regenerate.mutate()} disabled={regenerate.isPending}>
                {regenerate.isPending ? "Generating…" : "Generate itinerary"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
