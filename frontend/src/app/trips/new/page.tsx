"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { TripForm } from "@/components/TripForm";
import { api } from "@/lib/api";

function NewTrip() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useSearchParams();
  const initial = {
    destination: params.get("to") ?? undefined,
    start_date: params.get("start") ?? undefined,
    end_date: params.get("end") ?? undefined,
  };
  const hasInitial = Boolean(
    initial.destination || initial.start_date || initial.end_date,
  );

  return (
    <main className="mx-auto max-w-2xl px-6 py-14 md:pl-24">
      <Link
        href="/trips"
        className="font-[var(--font-mono)] text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:text-foreground"
      >
        ← My trips
      </Link>
      <p className="eyebrow mt-6">Plot a route</p>
      <h1 className="mt-3 font-[var(--font-display)] text-4xl font-normal tracking-tight">
        Plan a trip
      </h1>
      <p className="mb-8 mt-2 text-muted">
        Wander draws a day-by-day itinerary you can edit afterwards.
      </p>
      <TripForm
        initial={hasInitial ? initial : undefined}
        submitLabel="Generate itinerary"
        onSubmit={async (values) => {
          const trip = await api.createTrip(values);
          queryClient.invalidateQueries({ queryKey: ["trips"] });
          try {
            await api.generate(trip.id);
          } catch {
            // the trip page shows the empty state with a Regenerate button
          }
          router.push(`/trips/${trip.id}`);
        }}
      />
    </main>
  );
}

export default function NewTripPage() {
  return (
    <Suspense>
      <NewTrip />
    </Suspense>
  );
}
