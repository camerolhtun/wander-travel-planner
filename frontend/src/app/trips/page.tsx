"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ButtonLink } from "@/components/ui/Button";
import { TripListSkeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";

function nights(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const n = Math.round(ms / 86_400_000);
  return n <= 0 ? "1 day" : `${n + 1} days`;
}

export default function TripsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["trips"],
    queryFn: api.listTrips,
  });

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My trips</h1>
        <ButtonLink href="/trips/new" size="md">
          New trip
        </ButtonLink>
      </div>

      {isLoading && <TripListSkeleton />}

      {error && (
        <div className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">
          Couldn&apos;t load your trips. Make sure you&apos;re signed in and the API is
          running.
        </div>
      )}

      {data && data.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
          <div className="text-3xl" aria-hidden>
            🗺️
          </div>
          <p className="mt-3 font-medium">No trips yet</p>
          <p className="mt-1 text-sm text-muted">
            Create your first itinerary in under a minute.
          </p>
          <ButtonLink href="/trips/new" className="mt-4">
            Plan a trip
          </ButtonLink>
        </div>
      )}

      {data && data.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {data.map((trip) => (
            <li key={trip.id}>
              <Link
                href={`/trips/${trip.id}`}
                className="block h-full rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold">{trip.destination}</span>
                  <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-xs capitalize text-muted">
                    {trip.travel_style}
                  </span>
                </div>
                <div className="mt-1 text-sm text-muted">
                  {trip.start_date} → {trip.end_date}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                  <span>{nights(trip.start_date, trip.end_date)}</span>
                  <span>·</span>
                  <span>
                    {trip.num_travelers} traveller{trip.num_travelers > 1 ? "s" : ""}
                  </span>
                  {trip.budget_total != null && (
                    <>
                      <span>·</span>
                      <span>
                        {trip.currency} {trip.budget_total}
                      </span>
                    </>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
