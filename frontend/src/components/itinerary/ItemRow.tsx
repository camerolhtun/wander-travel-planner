"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { buttonClass } from "@/components/ui/Button";
import { controlClassSm } from "@/components/ui/Field";
import { api } from "@/lib/api";
import { CATEGORY_META } from "@/lib/categories";
import { ITEM_CATEGORIES, mapsSearchUrl } from "@/lib/constants";
import { moneyDual } from "@/lib/money";
import { tripCache } from "@/lib/tripCache";
import type { ItineraryItem } from "@/lib/types";

export function ItemRow({
  item,
  tripId,
  currency,
  localCurrency,
  fxRate,
  destination,
  isFirst,
  isLast,
  onMove,
}: {
  item: ItineraryItem;
  tripId: string;
  currency: string;
  localCurrency?: string | null;
  fxRate?: number | null;
  destination: string;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: -1 | 1) => void;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const meta = CATEGORY_META[item.category];

  const save = useMutation({
    mutationFn: (patch: Partial<ItineraryItem>) => api.updateItem(item.id, patch),
    onMutate: (patch) => tripCache.patchItem(queryClient, tripId, item.id, patch),
    onError: (_e, _v, ctx) => tripCache.rollback(queryClient, tripId, ctx),
    onSuccess: () => setEditing(false),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: tripCache.key(tripId) }),
  });

  const remove = useMutation({
    mutationFn: () => api.deleteItem(item.id),
    onMutate: () => tripCache.removeItem(queryClient, tripId, item.id),
    onError: (_e, _v, ctx) => tripCache.rollback(queryClient, tripId, ctx),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: tripCache.key(tripId) }),
  });

  // waypoint dot sitting on the day's trail line
  const dot = (
    <span
      className="absolute -left-[1.72rem] top-2 size-2 rounded-full bg-[var(--lake)] ring-4 ring-[var(--background)]"
      aria-hidden
    />
  );

  if (editing) {
    return (
      <li className="glass relative rounded-[18px] p-3">
        {dot}
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            save.mutate({
              title: String(f.get("title")),
              category: String(f.get("category")) as ItineraryItem["category"],
              start_time: String(f.get("start_time")) || null,
              end_time: String(f.get("end_time")) || null,
              est_cost: f.get("est_cost") ? Number(f.get("est_cost")) : null,
              description: String(f.get("description")) || null,
            });
          }}
        >
          <input
            name="title"
            defaultValue={item.title}
            required
            className={`${controlClassSm} w-full`}
          />
          <div className="flex flex-wrap gap-2">
            <select name="category" defaultValue={item.category} className={controlClassSm}>
              {ITEM_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_META[c].label}
                </option>
              ))}
            </select>
            <input
              name="start_time"
              type="time"
              defaultValue={item.start_time?.slice(0, 5)}
              className={controlClassSm}
            />
            <input
              name="end_time"
              type="time"
              defaultValue={item.end_time?.slice(0, 5)}
              className={controlClassSm}
            />
            <input
              name="est_cost"
              type="number"
              min="0"
              step="0.01"
              defaultValue={item.est_cost ?? undefined}
              placeholder="cost"
              className={`${controlClassSm} w-24`}
            />
          </div>
          <textarea
            name="description"
            defaultValue={item.description ?? ""}
            rows={2}
            className={`${controlClassSm} w-full`}
          />
          <div className="flex gap-2">
            <button className={buttonClass("primary", "sm")} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className={buttonClass("secondary", "sm")}
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  const timeLabel = [item.start_time?.slice(0, 5), item.end_time?.slice(0, 5)]
    .filter(Boolean)
    .join("–");

  return (
    <li className="group relative rounded-[18px] border border-border bg-surface/55 p-3.5 transition-colors duration-200 hover:border-[color-mix(in_oklab,var(--lake)_40%,var(--border))]">
      {dot}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 font-[var(--font-mono)] text-[0.7rem]">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium normal-case ${meta.badge}`}
            >
              <span aria-hidden>{meta.icon}</span>
              {meta.label}
            </span>
            {timeLabel && <span className="text-muted">{timeLabel}</span>}
            {item.est_cost != null && (
              <span className="text-muted">
                {moneyDual(item.est_cost, currency, localCurrency, fxRate)}
              </span>
            )}
          </div>
          <p className="mt-1.5 font-medium leading-snug">{item.title}</p>
          {item.description && (
            <p className="mt-1 text-sm leading-relaxed text-muted">{item.description}</p>
          )}
          {item.address && (
            <p className="mt-1 font-[var(--font-mono)] text-[0.7rem] text-muted">
              {item.address}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-1 opacity-60 transition-opacity group-hover:opacity-100 print:hidden">
          <button
            onClick={() => onMove(-1)}
            disabled={isFirst}
            className="grid size-6 place-items-center rounded-md border border-border text-xs disabled:opacity-25"
            aria-label="Move earlier"
          >
            ↑
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={isLast}
            className="grid size-6 place-items-center rounded-md border border-border text-xs disabled:opacity-25"
            aria-label="Move later"
          >
            ↓
          </button>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-3 font-[var(--font-mono)] text-[0.7rem] uppercase tracking-[0.1em] text-muted print:hidden">
        <button onClick={() => setEditing(true)} className="hover:text-foreground">
          Edit
        </button>
        <button
          onClick={() => {
            if (confirm(`Delete "${item.title}"?`)) remove.mutate();
          }}
          className="text-[var(--danger)] hover:underline"
        >
          Delete
        </button>
        <a
          href={mapsSearchUrl(item.place_name ?? `${item.title} ${destination}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground"
        >
          Maps ↗
        </a>
      </div>
    </li>
  );
}
