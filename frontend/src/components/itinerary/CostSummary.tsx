"use client";

import { useState } from "react";
import { CATEGORY_META } from "@/lib/categories";
import { ITEM_CATEGORIES } from "@/lib/constants";
import type { TripDetail } from "@/lib/types";

export function CostSummary({ trip }: { trip: TripDetail }) {
  const [open, setOpen] = useState(false);

  const items = trip.days.flatMap((d) => d.items);
  const total = items.reduce((s, i) => s + (i.est_cost ?? 0), 0);
  const perPerson = total / Math.max(trip.num_travelers, 1);
  const days = trip.days.length || 1;

  const byCategory = ITEM_CATEGORIES.map((cat) => ({
    cat,
    amount: items
      .filter((i) => i.category === cat)
      .reduce((s, i) => s + (i.est_cost ?? 0), 0),
  })).filter((r) => r.amount > 0);

  const fmt = (n: number) => `${trip.currency} ${n.toFixed(0)}`;

  return (
    <div className="rounded-xl border border-border bg-surface">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm print:hidden"
      >
        <span className="font-medium">Cost breakdown</span>
        <span className="text-muted">{open ? "Hide" : "Show"}</span>
      </button>

      <div className={open ? "block" : "hidden print:block"}>
        <div className="grid grid-cols-3 divide-x divide-border border-t border-border text-center">
          <Stat label="Total" value={fmt(total)} />
          <Stat label="Per person" value={fmt(perPerson)} />
          <Stat label="Per day avg" value={fmt(total / days)} />
        </div>

        {byCategory.length > 0 && (
          <div className="space-y-2 border-t border-border p-4">
            {byCategory.map(({ cat, amount }) => {
              const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
              return (
                <div key={cat} className="flex items-center gap-3 text-sm">
                  <span className="w-20 shrink-0 text-muted">
                    {CATEGORY_META[cat].icon} {CATEGORY_META[cat].label}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right tabular-nums">
                    {fmt(amount)}
                    <span className="ml-1 text-xs text-muted">{pct}%</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 py-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-0.5 font-semibold tabular-nums">{value}</div>
    </div>
  );
}
