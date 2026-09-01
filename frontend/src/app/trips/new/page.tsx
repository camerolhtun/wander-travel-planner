"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { TripForm } from "@/components/TripForm";
import { api } from "@/lib/api";

export default function NewTripPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Link href="/trips" className="text-sm text-muted hover:text-foreground">
        ← My trips
      </Link>
      <h1 className="mt-2 mb-1 text-2xl font-bold">Plan a trip</h1>
      <p className="mb-6 text-sm text-muted">
        We&apos;ll generate a day-by-day itinerary you can edit afterwards.
      </p>
      <TripForm
        submitLabel="Generate itinerary"
        onSubmit={async (values) => {
          const trip = await api.createTrip(values);
          queryClient.invalidateQueries({ queryKey: ["trips"] });
          // Kick off generation but don't block navigation on it — if it fails,
          // the trip page shows the empty state with a Regenerate button.
          try {
            await api.generate(trip.id);
          } catch {
            // handled on the trip page
          }
          router.push(`/trips/${trip.id}`);
        }}
      />
    </main>
  );
}
