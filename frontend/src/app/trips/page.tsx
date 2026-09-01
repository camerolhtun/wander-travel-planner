"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ButtonLink } from "@/components/ui/Button";
import { TripListSkeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";

function span(start: string, end: string) {
  const n = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 86_400_000,
  );
  return n <= 0 ? "1 day" : `${n + 1} days`;
}

export default function TripsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["trips"],
    queryFn: api.listTrips,
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-14 md:pl-24">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your routes</p>
          <h1 className="mt-3 font-[var(--font-display)] text-4xl font-normal tracking-tight">
            My trips
          </h1>
        </div>
        <ButtonLink href="/trips/new" arrow>
          New trip
        </ButtonLink>
      </div>

      <div className="mt-10">
        {isLoading && <TripListSkeleton />}

        {error && (
          <div className="glass rounded-[22px] p-6 text-sm text-muted">
            Couldn&apos;t load your trips. Make sure you&apos;re signed in.
          </div>
        )}

        {data && data.length === 0 && (
          <div className="glass rounded-[26px] p-12 text-center">
            <p className="font-[var(--font-display)] text-2xl">No trips yet</p>
            <p className="mt-2 text-sm text-muted">
              Your first route takes about a minute.
            </p>
            <ButtonLink href="/trips/new" arrow className="mt-6">
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
                  className="glass group block h-full rounded-[22px] p-5 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-[var(--font-display)] text-lg leading-tight">
                      {trip.destination}
                    </span>
                    <span className="shrink-0 font-[var(--font-mono)] text-[0.7rem] uppercase tracking-[0.12em] text-muted">
                      {trip.travel_style}
                    </span>
                  </div>
                  <div className="mt-2 font-[var(--font-mono)] text-xs text-muted">
                    {trip.start_date} → {trip.end_date}
                  </div>
                  <div className="mt-4 flex items-center gap-3 border-t border-border pt-3 font-[var(--font-mono)] text-[0.7rem] uppercase tracking-[0.1em] text-muted">
                    <span>{span(trip.start_date, trip.end_date)}</span>
                    <span className="text-border">·</span>
                    <span>
                      {trip.num_travelers} traveller
                      {trip.num_travelers > 1 ? "s" : ""}
                    </span>
                    {trip.budget_total != null && (
                      <>
                        <span className="text-border">·</span>
                        <span>
                          {trip.currency} {trip.budget_total}
                        </span>
                      </>
                    )}
                    <span className="ml-auto text-[var(--lake)] transition-transform duration-200 group-hover:translate-x-0.5">
                      →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
