import type { QueryClient } from "@tanstack/react-query";
import type { ItineraryItem, TripDetail } from "@/lib/types";

type Ctx = { previous: TripDetail | undefined };

function key(tripId: string) {
  return ["trip", tripId] as const;
}

async function begin(qc: QueryClient, tripId: string): Promise<Ctx> {
  await qc.cancelQueries({ queryKey: key(tripId) });
  return { previous: qc.getQueryData<TripDetail>(key(tripId)) };
}

function write(
  qc: QueryClient,
  tripId: string,
  fn: (trip: TripDetail) => TripDetail,
) {
  qc.setQueryData<TripDetail>(key(tripId), (old) => (old ? fn(old) : old));
}

export const tripCache = {
  key,
  rollback(qc: QueryClient, tripId: string, ctx?: Ctx) {
    if (ctx?.previous) qc.setQueryData(key(tripId), ctx.previous);
  },

  async patchItem(
    qc: QueryClient,
    tripId: string,
    itemId: string,
    patch: Partial<ItineraryItem>,
  ) {
    const ctx = await begin(qc, tripId);
    write(qc, tripId, (trip) => ({
      ...trip,
      days: trip.days.map((day) => ({
        ...day,
        items: day.items.map((it) =>
          it.id === itemId ? { ...it, ...patch, is_user_edited: true } : it,
        ),
      })),
    }));
    return ctx;
  },

  async removeItem(qc: QueryClient, tripId: string, itemId: string) {
    const ctx = await begin(qc, tripId);
    write(qc, tripId, (trip) => ({
      ...trip,
      days: trip.days.map((day) => ({
        ...day,
        items: day.items.filter((it) => it.id !== itemId),
      })),
    }));
    return ctx;
  },

  async reorderDay(
    qc: QueryClient,
    tripId: string,
    dayId: string,
    orderedIds: string[],
  ) {
    const ctx = await begin(qc, tripId);
    write(qc, tripId, (trip) => ({
      ...trip,
      days: trip.days.map((day) =>
        day.id !== dayId
          ? day
          : {
              ...day,
              items: [...day.items]
                .sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id))
                .map((it, i) => ({ ...it, sort_order: i })),
            },
      ),
    }));
    return ctx;
  },

  async patchDay(
    qc: QueryClient,
    tripId: string,
    dayId: string,
    patch: { summary?: string | null; est_budget?: number | null },
  ) {
    const ctx = await begin(qc, tripId);
    write(qc, tripId, (trip) => ({
      ...trip,
      days: trip.days.map((day) =>
        day.id === dayId ? { ...day, ...patch, is_user_edited: true } : day,
      ),
    }));
    return ctx;
  },
};
