"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TripForm } from "@/components/TripForm";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";

export default function EditTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: trip, isLoading, error } = useQuery({
    queryKey: ["trip", id],
    queryFn: () => api.getTrip(id),
  });

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Link href={`/trips/${id}`} className="text-sm text-muted hover:text-foreground">
        ← Back to trip
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-bold">Edit trip details</h1>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}
      {error && <p className="text-sm text-danger">Could not load this trip.</p>}

      {trip && (
        <>
          <TripForm
            initial={trip}
            submitLabel="Save changes"
            onSubmit={async (values) => {
              await api.updateTrip(id, values);
              queryClient.invalidateQueries({ queryKey: ["trip", id] });
              queryClient.invalidateQueries({ queryKey: ["trips"] });
              router.push(`/trips/${id}`);
            }}
          />
          <p className="mt-4 text-sm text-muted">
            Saving details doesn&apos;t rewrite the itinerary — use Regenerate on the trip
            page for that (your edited days are kept).
          </p>
        </>
      )}
    </main>
  );
}
