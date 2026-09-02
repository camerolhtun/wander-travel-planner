"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CitySuggest } from "@/components/ui/CitySuggest";
import { CurrencySuggest } from "@/components/ui/CurrencySuggest";
import { DateRangeField } from "@/components/ui/DateRangeField";
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
  const [destination, setDestination] = useState(initial?.destination ?? "");
  const [startDate, setStartDate] = useState(initial?.start_date ?? "");
  const [endDate, setEndDate] = useState(initial?.end_date ?? "");
  const [currency, setCurrency] = useState(initial?.currency ?? "USD");
  const [notes, setNotes] = useState(initial?.notes ?? "");

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
    if (!destination.trim()) {
      setError("Enter a destination.");
      setSubmitting(false);
      return;
    }
    if (!startDate || !endDate) {
      setError("Pick your travel dates.");
      setSubmitting(false);
      return;
    }
    if (endDate < startDate) {
      setError("End date must be on or after the start date.");
      setSubmitting(false);
      return;
    }
    const days =
      Math.round((Date.parse(endDate) - Date.parse(startDate)) / 86_400_000) + 1;
    if (days > 21) {
      setError("Trips are capped at 21 days.");
      setSubmitting(false);
      return;
    }
    try {
      await onSubmit({
        destination: destination.trim(),
        start_date: startDate,
        end_date: endDate,
        budget_total: form.get("budget_total") ? Number(form.get("budget_total")) : null,
        currency: currency.trim().toUpperCase() || "USD",
        num_travelers: Number(form.get("num_travelers") || 1),
        interests,
        travel_style: String(form.get("travel_style")) as TravelStyle,
        pace: String(form.get("pace")) as Pace,
        notes: notes.trim() || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="glass space-y-4 rounded-[22px] p-5">
        <Label>
          <LabelText>Destination</LabelText>
          <CitySuggest
            value={destination}
            onChange={setDestination}
            inputClassName={controlClass}
            placeholder="Kyoto, Japan"
          />
        </Label>
        <div className="flex flex-col gap-1.5">
          <LabelText>Travel dates</LabelText>
          <DateRangeField
            start={startDate}
            end={endDate}
            onChange={(s, e) => {
              setStartDate(s);
              setEndDate(e);
            }}
            className="rounded-xl border border-border bg-surface/70"
            labelClass="font-[var(--font-mono)] text-[0.66rem] uppercase tracking-[0.14em] text-muted"
            fieldClass="text-sm"
            dividerClass="bg-border"
            triggerHoverClass="hover:bg-surface-2"
          />
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
            <CurrencySuggest
              value={currency}
              onChange={setCurrency}
              inputClassName={controlClass}
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

      <section className="glass space-y-4 rounded-[22px] p-5">
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
                  className={`rounded-full border px-3.5 py-1.5 text-sm capitalize transition-colors duration-200 ${
                    on
                      ? "border-[var(--lake)] bg-[var(--lake)] text-white"
                      : "border-border text-muted hover:border-[var(--lake)] hover:text-foreground"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <LabelText>Anything specific?</LabelText>
          <p className="text-xs text-muted">
            Occasions, must-dos, foods you love, places or activities to avoid,
            mobility needs, a splurge you want built in — Wander plans around it.
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            maxLength={2000}
            className={`${controlClass} resize-y leading-relaxed`}
            placeholder="e.g. Celebrating our anniversary. We love ramen and vinyl bars, want one slow onsen day, and prefer trains over taxis. Skip anything too touristy."
          />
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

      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={submitting} arrow={!submitting}>
          {submitting ? "Drawing your route…" : submitLabel}
        </Button>
        {submitting && (
          <span className="font-[var(--font-mono)] text-xs text-muted">
            this takes a few seconds
          </span>
        )}
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      </div>
    </form>
  );
}
