"use client";

import { useState } from "react";
import { CATEGORY_META } from "@/lib/categories";
import { ITEM_CATEGORIES } from "@/lib/constants";
import { localMoney, money } from "@/lib/money";
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

  const fmt = (n: number) => money(n, trip.currency);
  const local = (n: number) =>
    localMoney(n, trip.currency, trip.local_currency, trip.fx_rate);
  // Local currency leads; selected currency drops to the muted second line.
  const primary = (n: number) => local(n) ?? fmt(n);
  const secondary = (n: number) => (local(n) ? fmt(n) : null);

  return (
    <div className="glass rounded-[20px]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 font-[var(--font-mono)] text-xs uppercase tracking-[0.14em] text-muted print:hidden"
      >
        <span className="text-foreground">Cost breakdown</span>
        <span>{open ? "Hide" : "Show"}</span>
      </button>

      <div className={open ? "block" : "hidden print:block"}>
        <div className="grid grid-cols-3 divide-x divide-[var(--border)] border-t border-border text-center">
          <Stat label="Total" value={primary(total)} sub={secondary(total)} />
          <Stat
            label="Per person"
            value={primary(perPerson)}
            sub={secondary(perPerson)}
          />
          <Stat
            label="Per day"
            value={primary(total / days)}
            sub={secondary(total / days)}
          />
        </div>

        {byCategory.length > 0 && (
          <div className="space-y-2.5 border-t border-border p-4">
            {byCategory.map(({ cat, amount }) => {
              const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
              return (
                <div key={cat} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 font-[var(--font-mono)] text-[0.7rem] text-muted">
                    {CATEGORY_META[cat].icon} {CATEGORY_META[cat].label}
                  </span>
                  <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-[var(--lake)]"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right font-[var(--font-mono)] text-xs tabular-nums">
                    {fmt(amount)}
                    <span className="ml-1 text-muted">{pct}%</span>
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

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string | null;
}) {
  return (
    <div className="px-2 py-3.5">
      <div className="font-[var(--font-mono)] text-[0.65rem] uppercase tracking-[0.14em] text-muted">
        {label}
      </div>
      <div className="mt-1 font-[var(--font-mono)] text-sm tabular-nums">{value}</div>
      {sub && (
        <div className="mt-0.5 font-[var(--font-mono)] text-[0.7rem] tabular-nums text-muted">
          {sub}
        </div>
      )}
    </div>
  );
}
