"use client";

import { useEffect, useRef, useState } from "react";
import {
  addDays,
  addMonths,
  formatMonthYear,
  formatShort,
  fromISO,
  isSameDay,
  monthGrid,
  startOfDay,
  toISO,
  WEEKDAYS,
} from "@/lib/dates";

type Props = {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
  className?: string;
  labelClass?: string;
  fieldClass?: string;
  dividerClass?: string;
  triggerHoverClass?: string;
};

export function DateRangeField({
  start,
  end,
  onChange,
  className = "",
  labelClass = "",
  fieldClass = "",
  dividerClass = "bg-white/15",
  triggerHoverClass = "hover:bg-white/10",
}: Props) {
  const today = startOfDay(new Date());
  const startD = start ? fromISO(start) : null;
  const endD = end ? fromISO(end) : null;

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"start" | "end">("start");
  const [viewMonth, setViewMonth] = useState(() => startD ?? new Date());
  const [hover, setHover] = useState<Date | null>(null);
  const [focusDay, setFocusDay] = useState<Date>(() => startD ?? today);
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");

  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const fromBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        fromBtnRef.current?.focus({ preventScroll: true });
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`[data-day="${toISO(focusDay)}"]`)
      ?.focus({ preventScroll: true });
  }, [open, focusDay, viewMonth]);

  // Open above the trigger when there isn't room below, so the popover never
  // gets clipped or forces the page to scroll.
  useEffect(() => {
    if (!open) return;
    function measure() {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      const POPOVER_H = 360;
      const spaceBelow = window.innerHeight - rect.bottom;
      setPlacement(
        spaceBelow < POPOVER_H && rect.top > spaceBelow ? "top" : "bottom",
      );
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open]);

  function openWith(which: "start" | "end") {
    const effective = which === "end" && !startD ? "start" : which;
    setMode(effective);
    const anchor = (effective === "end" ? endD : startD) ?? new Date();
    setViewMonth(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
    setFocusDay((effective === "end" ? endD : startD) ?? today);
    setOpen(true);
  }

  function pick(d0: Date) {
    const d = startOfDay(d0);
    if (d < today) return;

    if (mode === "start" || !startD || (startD && endD)) {
      onChange(toISO(d), "");
      setMode("end");
      setHover(null);
      setFocusDay(d);
      return;
    }
    if (d < startD) {
      onChange(toISO(d), "");
      setMode("end");
      setFocusDay(d);
      return;
    }
    onChange(toISO(startD), toISO(d));
    setHover(null);
    setOpen(false);
    fromBtnRef.current?.focus({ preventScroll: true });
  }

  function disabledDay(d: Date) {
    if (startOfDay(d) < today) return true;
    if (mode === "end" && startD && !endD && startOfDay(d) < startD) return true;
    return false;
  }

  function onGridKey(e: React.KeyboardEvent) {
    let next: Date | null = null;
    const k = e.key;
    if (k === "ArrowRight") next = addDays(focusDay, 1);
    else if (k === "ArrowLeft") next = addDays(focusDay, -1);
    else if (k === "ArrowDown") next = addDays(focusDay, 7);
    else if (k === "ArrowUp") next = addDays(focusDay, -7);
    else if (k === "PageDown")
      next = new Date(focusDay.getFullYear(), focusDay.getMonth() + 1, focusDay.getDate());
    else if (k === "PageUp")
      next = new Date(focusDay.getFullYear(), focusDay.getMonth() - 1, focusDay.getDate());
    else if (k === "Home") next = addDays(focusDay, -((focusDay.getDay() + 6) % 7));
    else if (k === "End") next = addDays(focusDay, 6 - ((focusDay.getDay() + 6) % 7));
    else if (k === "Enter" || k === " ") {
      e.preventDefault();
      pick(focusDay);
      return;
    } else return;

    e.preventDefault();
    const n = startOfDay(next);
    setFocusDay(n);
    if (n.getMonth() !== viewMonth.getMonth() || n.getFullYear() !== viewMonth.getFullYear())
      setViewMonth(new Date(n.getFullYear(), n.getMonth(), 1));
  }

  const rangeEnd = endD ?? (mode === "end" && startD && hover ? hover : null);
  const prevDisabled =
    viewMonth.getFullYear() < today.getFullYear() ||
    (viewMonth.getFullYear() === today.getFullYear() &&
      viewMonth.getMonth() <= today.getMonth());

  const trigger = (which: "start" | "end", ref?: React.Ref<HTMLButtonElement>) => {
    const val = which === "start" ? startD : endD;
    return (
      <button
        type="button"
        ref={ref}
        onClick={() => openWith(which)}
        className={`flex flex-1 flex-col items-start gap-0.5 rounded-[16px] px-4 py-2.5 text-left transition-colors ${triggerHoverClass}`}
      >
        <span className={labelClass}>{which === "start" ? "From" : "To"}</span>
        <span className={`${fieldClass} ${val ? "" : "opacity-55"}`}>
          {val ? formatShort(val) : "Add date"}
        </span>
      </button>
    );
  };

  return (
    <div ref={rootRef} className={`relative flex items-stretch ${className}`}>
      {trigger("start", fromBtnRef)}
      <span className={`my-2 w-px ${dividerClass}`} />
      {trigger("end")}

      {open && (
        <div
          role="dialog"
          aria-label="Choose travel dates"
          className={`glass absolute left-0 z-50 max-h-[calc(100dvh-2rem)] w-[19.5rem] overflow-y-auto rounded-[20px] p-3 text-foreground ${
            placement === "top" ? "bottom-full mb-3" : "top-full mt-3"
          }`}
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              disabled={prevDisabled}
              onClick={() => setViewMonth(addMonths(viewMonth, -1))}
              className="grid size-7 place-items-center rounded-full text-lg leading-none transition-colors hover:bg-surface-2 disabled:opacity-25"
            >
              ‹
            </button>
            <span className="font-[var(--font-display)] text-sm font-semibold">
              {formatMonthYear(viewMonth)}
            </span>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              className="grid size-7 place-items-center rounded-full text-lg leading-none transition-colors hover:bg-surface-2"
            >
              ›
            </button>
          </div>

          <p className="mt-1 font-[var(--font-mono)] text-[0.6rem] uppercase tracking-[0.16em] text-muted">
            {mode === "end" && startD && !endD ? "Select end date" : "Select start date"}
          </p>

          <div className="mt-2 grid grid-cols-7 text-center font-[var(--font-mono)] text-[0.55rem] uppercase tracking-wide text-muted">
            {WEEKDAYS.map((w) => (
              <span key={w} className="py-1">
                {w.slice(0, 2)}
              </span>
            ))}
          </div>

          <div
            ref={gridRef}
            role="grid"
            onKeyDown={onGridKey}
            onMouseLeave={() => setHover(null)}
            className="grid grid-cols-7 gap-y-1"
          >
            {monthGrid(viewMonth).map((d) => {
              const day = startOfDay(d);
              const inMonth = d.getMonth() === viewMonth.getMonth();
              const disabled = disabledDay(d);
              const isStart = !!startD && isSameDay(day, startD);
              const isEnd = !!rangeEnd && isSameDay(day, rangeEnd);
              const inRange =
                !!startD && !!rangeEnd && day > startD && day < rangeEnd;
              const solid = isStart || isEnd;

              let rounded = "rounded-full";
              if (inRange) rounded = "rounded-none";
              else if (isStart && rangeEnd && !isSameDay(day, rangeEnd))
                rounded = "rounded-l-full";
              else if (isEnd && startD && !isSameDay(day, startD))
                rounded = "rounded-r-full";

              return (
                <button
                  key={toISO(d)}
                  type="button"
                  data-day={toISO(d)}
                  role="gridcell"
                  aria-label={d.toDateString()}
                  aria-selected={solid || undefined}
                  aria-disabled={disabled || undefined}
                  disabled={disabled}
                  tabIndex={isSameDay(day, focusDay) ? 0 : -1}
                  onMouseEnter={() => !disabled && setHover(day)}
                  onClick={() => pick(d)}
                  className={[
                    "grid h-9 w-full place-items-center text-sm transition-colors",
                    rounded,
                    disabled
                      ? "cursor-not-allowed text-muted/30"
                      : !inMonth
                        ? "text-muted/45"
                        : "",
                    !disabled && solid && "bg-[var(--lake)] font-medium text-white",
                    !disabled &&
                      !solid &&
                      inRange &&
                      "bg-[color-mix(in_oklab,var(--sky)_32%,transparent)]",
                    !disabled &&
                      !solid &&
                      !inRange &&
                      "hover:bg-[color-mix(in_oklab,var(--sky)_48%,transparent)]",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          {(startD || endD) && (
            <button
              type="button"
              onClick={() => {
                onChange("", "");
                setMode("start");
                setHover(null);
              }}
              className="mt-2 w-full rounded-lg py-1.5 font-[var(--font-mono)] text-[0.6rem] uppercase tracking-[0.14em] text-muted transition-colors hover:text-foreground"
            >
              Clear dates
            </button>
          )}
        </div>
      )}
    </div>
  );
}
