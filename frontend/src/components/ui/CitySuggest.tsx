"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  type City,
  label as cityLabel,
  loadCities,
  searchCities,
} from "@/lib/citySearch";

/**
 * Destination combobox with an offline city typeahead.
 * Controlled: `value` is the text shown / submitted; picking a suggestion
 * sets it to "City, Country".
 */
export function CitySuggest({
  value,
  onChange,
  name,
  placeholder = "Kyoto, Japan",
  inputClassName = "",
  autoFocus = false,
  onEnterWithoutPick,
}: {
  value: string;
  onChange: (next: string) => void;
  name?: string;
  placeholder?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  onEnterWithoutPick?: () => void;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [cities, setCities] = useState<City[] | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [touched, setTouched] = useState(false);

  // load the dataset on first interaction
  useEffect(() => {
    if (touched && !cities) loadCities().then(setCities);
  }, [touched, cities]);

  const matches = cities && touched ? searchCities(cities, value) : [];
  const showList = open && matches.length > 0;

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  function pick(city: City) {
    onChange(cityLabel(city));
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!showList) {
      if (e.key === "ArrowDown" && matches.length) {
        setOpen(true);
        setActive(0);
        e.preventDefault();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      setActive((i) => (i + 1) % matches.length);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setActive((i) => (i - 1 + matches.length) % matches.length);
      e.preventDefault();
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(matches[active] ?? matches[0]);
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        name={name}
        value={value}
        autoFocus={autoFocus}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-1p-ignore
        data-lpignore="true"
        data-form-type="other"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          showList ? `${listId}-opt-${active}` : undefined
        }
        placeholder={placeholder}
        onFocus={() => {
          setTouched(true);
          setOpen(true);
        }}
        onChange={(e) => {
          onChange(e.target.value);
          setActive(0);
          setOpen(true);
          setTouched(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !showList) onEnterWithoutPick?.();
          onKeyDown(e);
        }}
        className={inputClassName}
      />

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 top-full z-50 mt-2 max-h-72 w-[18rem] max-w-[calc(100vw-2.5rem)] overflow-auto rounded-2xl border border-border bg-[var(--surface)] p-1.5 text-sm shadow-[0_20px_50px_-16px_rgba(23,60,82,0.28)]"
        >
          {matches.map((city, i) => (
            <li
              key={`${city.n}-${city.c}`}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(city);
              }}
              className={`flex cursor-pointer items-baseline gap-2 rounded-xl px-3 py-2 ${
                i === active
                  ? "bg-[color-mix(in_oklab,var(--sky)_38%,transparent)] text-foreground"
                  : ""
              }`}
            >
              <span className="truncate font-medium">{city.n}</span>
              <span className="ml-auto shrink-0 font-[var(--font-mono)] text-[0.72rem] text-muted">
                {city.c}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
