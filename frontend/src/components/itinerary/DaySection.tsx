"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { buttonClass } from "@/components/ui/Button";
import { controlClassSm } from "@/components/ui/Field";
import { api } from "@/lib/api";
import { CATEGORY_META } from "@/lib/categories";
import { ITEM_CATEGORIES } from "@/lib/constants";
import { tripCache } from "@/lib/tripCache";
import type { ItineraryDay } from "@/lib/types";
import { ItemRow } from "./ItemRow";

export function DaySection({
  day,
  tripId,
  currency,
  destination,
}: {
  day: ItineraryDay;
  tripId: string;
  currency: string;
  destination: string;
}) {
  const queryClient = useQueryClient();
  const [editingSummary, setEditingSummary] = useState(false);
  const [adding, setAdding] = useState(false);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: tripCache.key(tripId) });

  const saveDay = useMutation({
    mutationFn: (patch: { summary?: string | null; est_budget?: number | null }) =>
      api.updateDay(day.id, patch),
    onMutate: (patch) => tripCache.patchDay(queryClient, tripId, day.id, patch),
    onError: (_e, _v, ctx) => tripCache.rollback(queryClient, tripId, ctx),
    onSuccess: () => setEditingSummary(false),
    onSettled: invalidate,
  });

  const addItem = useMutation({
    mutationFn: (body: Parameters<typeof api.addItem>[1]) => api.addItem(day.id, body),
    onSuccess: () => {
      invalidate();
      setAdding(false);
    },
  });

  const reorder = useMutation({
    mutationFn: (items: { id: string; day_id: string; sort_order: number }[]) =>
      api.reorderItems(items),
    onMutate: (items) =>
      tripCache.reorderDay(
        queryClient,
        tripId,
        day.id,
        items.map((i) => i.id),
      ),
    onError: (_e, _v, ctx) => tripCache.rollback(queryClient, tripId, ctx),
    onSettled: invalidate,
  });

  const dayCost = day.items.reduce((sum, i) => sum + (i.est_cost ?? 0), 0);
  const overDay = day.est_budget != null && dayCost > day.est_budget;

  function move(index: number, direction: -1 | 1) {
    const next = [...day.items];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorder.mutate(next.map((it, i) => ({ id: it.id, day_id: day.id, sort_order: i })));
  }

  return (
    <section className="scroll-mt-20" id={`day-${day.day_index}`}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">
          Day {day.day_index}
          {day.date && <span className="ml-2 text-sm font-normal text-muted">{day.date}</span>}
        </h2>
        <span className={`text-sm ${overDay ? "text-danger" : "text-muted"}`}>
          {currency} {dayCost.toFixed(0)}
          {day.est_budget != null && ` / ${day.est_budget}`}
        </span>
      </div>

      {editingSummary ? (
        <form
          className="mb-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            saveDay.mutate({
              summary: String(f.get("summary")) || null,
              est_budget: f.get("est_budget") ? Number(f.get("est_budget")) : null,
            });
          }}
        >
          <textarea
            name="summary"
            defaultValue={day.summary ?? ""}
            rows={2}
            className={`${controlClassSm} w-full`}
          />
          <div className="flex items-center gap-2">
            <input
              name="est_budget"
              type="number"
              min="0"
              defaultValue={day.est_budget ?? undefined}
              placeholder="day budget"
              className={`${controlClassSm} w-32`}
            />
            <button className={buttonClass("primary", "sm")} disabled={saveDay.isPending}>
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditingSummary(false)}
              className={buttonClass("secondary", "sm")}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <p className="mb-3 text-sm text-muted">
          {day.summary || <span className="italic">No summary</span>}{" "}
          <button
            onClick={() => setEditingSummary(true)}
            className="text-primary hover:underline"
          >
            edit
          </button>
        </p>
      )}

      <ul className="space-y-2 border-l-2 border-border pl-4">
        {day.items.map((item, index) => (
          <ItemRow
            key={item.id}
            item={item}
            tripId={tripId}
            currency={currency}
            destination={destination}
            isFirst={index === 0}
            isLast={index === day.items.length - 1}
            onMove={(direction) => move(index, direction)}
          />
        ))}
      </ul>

      {adding ? (
        <form
          className="mt-3 space-y-2 rounded-xl border border-dashed border-border p-3"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            addItem.mutate({
              title: String(f.get("title")),
              category: String(f.get("category")) as ItineraryDay["items"][number]["category"],
              start_time: String(f.get("start_time")) || null,
              est_cost: f.get("est_cost") ? Number(f.get("est_cost")) : null,
              sort_order: day.items.length,
            });
          }}
        >
          <input
            name="title"
            required
            placeholder="Title"
            className={`${controlClassSm} w-full`}
          />
          <div className="flex flex-wrap gap-2">
            <select name="category" defaultValue="activity" className={controlClassSm}>
              {ITEM_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_META[c].label}
                </option>
              ))}
            </select>
            <input name="start_time" type="time" className={controlClassSm} />
            <input
              name="est_cost"
              type="number"
              min="0"
              step="0.01"
              placeholder="cost"
              className={`${controlClassSm} w-24`}
            />
          </div>
          <div className="flex gap-2">
            <button className={buttonClass("primary", "sm")} disabled={addItem.isPending}>
              Add
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className={buttonClass("secondary", "sm")}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-3 rounded-lg border border-dashed border-border px-3 py-1.5 text-sm text-muted hover:text-foreground"
        >
          + Add item
        </button>
      )}
    </section>
  );
}
