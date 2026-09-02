"use client";

import { useEffect, useId, useRef, useState } from "react";
import { type Currency, searchCurrencies } from "@/lib/currencies";

/**
 * Currency combobox — type a code or name ("r", "eur", "yen") and pick from
 * a dropdown. Controlled: `value` is the 3-letter ISO code shown / submitted.
 */
export function CurrencySuggest({
  value,
  onChange,
  name,
  inputClassName = "",
}: {
  value: string;
  onChange: (next: string) => void;
  name?: string;
  inputClassName?: string;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState<string | null>(null);

  // While the field is untouched, filter by the committed value; once the user
  // types, filter by what they've typed.
  const matches = searchCurrencies(query ?? value);
  const showList = open && matches.length > 0;

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  function pick(c: Currency) {
    onChange(c.code);
    setQuery(null);
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
    } else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        name={name}
        value={query ?? value}
        maxLength={3}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="characters"
        spellCheck={false}
        data-1p-ignore
        data-lpignore="true"
        data-form-type="other"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList ? `${listId}-opt-${active}` : undefined}
        placeholder="USD"
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Snap back to the committed code if the user typed something unpicked.
          setQuery(null);
        }}
        onChange={(e) => {
          setQuery(e.target.value.toUpperCase());
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className={inputClassName}
      />

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 top-full z-50 mt-2 max-h-72 w-[20rem] max-w-[calc(100vw-2.5rem)] overflow-auto rounded-2xl border border-border bg-[var(--surface)] p-1.5 text-sm shadow-[0_20px_50px_-16px_rgba(23,60,82,0.28)]"
        >
          {matches.map((c, i) => (
            <li
              key={c.code}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(c);
              }}
              className={`flex cursor-pointer items-baseline gap-2.5 rounded-xl px-3 py-2 ${
                i === active
                  ? "bg-[color-mix(in_oklab,var(--sky)_38%,transparent)] text-foreground"
                  : ""
              }`}
            >
              <span className="w-10 shrink-0 font-[var(--font-mono)] font-medium">
                {c.code}
              </span>
              <span className="truncate text-muted">{c.name}</span>
              <span className="ml-auto shrink-0 font-[var(--font-mono)] text-[0.72rem] text-muted">
                {c.symbol}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
