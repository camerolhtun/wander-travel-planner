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
    <main className="mx-auto max-w-2xl px-6 py-14 md:pl-24">
      <Link
        href={`/trips/${id}`}
        className="font-[var(--font-mono)] text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:text-foreground"
      >
        ← Back to trip
      </Link>
      <h1 className="mb-8 mt-6 font-[var(--font-display)] text-4xl font-normal tracking-tight">
        Edit details
      </h1>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      )}
      {error && (
        <p className="text-sm text-[var(--danger)]">Could not load this trip.</p>
      )}

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
          <p className="mt-5 font-[var(--font-mono)] text-xs leading-relaxed text-muted">
            Saving details doesn&apos;t rewrite the itinerary — use Regenerate on the
            trip page for that. Your edited days are kept.
          </p>
        </>
      )}
    </main>
  );
}
