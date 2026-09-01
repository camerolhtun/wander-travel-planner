"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { controlClass, Label, LabelText } from "@/components/ui/Field";
import { INTEREST_OPTIONS } from "@/lib/constants";
import type { Pace, TravelStyle, TripCreateInput } from "@/lib/types";

export function TripForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<TripCreateInput>;
  submitLabel: string;
  onSubmit: (values: TripCreateInput) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>(initial?.interests ?? []);

  function toggleInterest(value: string) {
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value],
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    if (String(form.get("end_date")) < String(form.get("start_date"))) {
      setError("End date must be on or after the start date.");
      setSubmitting(false);
      return;
    }
    try {
      await onSubmit({
        destination: String(form.get("destination")),
        start_date: String(form.get("start_date")),
        end_date: String(form.get("end_date")),
        budget_total: form.get("budget_total") ? Number(form.get("budget_total")) : null,
        currency: String(form.get("currency") || "USD"),
        num_travelers: Number(form.get("num_travelers") || 1),
        interests,
        travel_style: String(form.get("travel_style")) as TravelStyle,
        pace: String(form.get("pace")) as Pace,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <Label>
          <LabelText>Destination</LabelText>
          <input
            name="destination"
            required
            defaultValue={initial?.destination}
            className={controlClass}
            placeholder="Kyoto, Japan"
          />
        </Label>
        <div className="grid grid-cols-2 gap-4">
          <Label>
            <LabelText>Start date</LabelText>
            <input
              name="start_date"
              type="date"
              required
              defaultValue={initial?.start_date}
              className={controlClass}
            />
          </Label>
          <Label>
            <LabelText>End date</LabelText>
            <input
              name="end_date"
              type="date"
              required
              defaultValue={initial?.end_date}
              className={controlClass}
            />
          </Label>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Label>
            <LabelText>Budget (total)</LabelText>
            <input
              name="budget_total"
              type="number"
              min="0"
              defaultValue={initial?.budget_total ?? undefined}
              className={controlClass}
              placeholder="1500"
            />
          </Label>
          <Label>
            <LabelText>Currency</LabelText>
            <input
              name="currency"
              defaultValue={initial?.currency ?? "USD"}
              className={controlClass}
              maxLength={3}
            />
          </Label>
          <Label className="col-span-2 sm:col-span-1">
            <LabelText>Travellers</LabelText>
            <input
              name="num_travelers"
              type="number"
              min="1"
              defaultValue={initial?.num_travelers ?? 1}
              className={controlClass}
            />
          </Label>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <div className="space-y-2">
          <LabelText>Interests</LabelText>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((opt) => {
              const on = interests.includes(opt);
              return (
                <button
                  type="button"
                  key={opt}
                  onClick={() => toggleInterest(opt)}
                  aria-pressed={on}
                  className={`rounded-full border px-3 py-1 text-sm capitalize transition-colors ${
                    on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-surface-2"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Label>
            <LabelText>Travel style</LabelText>
            <select
              name="travel_style"
              defaultValue={initial?.travel_style ?? "mid"}
              className={controlClass}
            >
              <option value="budget">Budget</option>
              <option value="mid">Mid-range</option>
              <option value="luxury">Luxury</option>
            </select>
          </Label>
          <Label>
            <LabelText>Pace</LabelText>
            <select
              name="pace"
              defaultValue={initial?.pace ?? "moderate"}
              className={controlClass}
            >
              <option value="relaxed">Relaxed</option>
              <option value="moderate">Moderate</option>
              <option value="packed">Packed</option>
            </select>
          </Label>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button disabled={submitting}>{submitting ? "Working…" : submitLabel}</Button>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </form>
  );
}
