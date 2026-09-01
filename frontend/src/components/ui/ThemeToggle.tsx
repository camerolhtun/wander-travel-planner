"use client";

import { useEffect, useState } from "react";

type Mode = "light" | "dark" | "system";

function apply(mode: Mode) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (mode !== "system") root.classList.add(mode);
  try {
    if (mode === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", mode);
  } catch {
    /* ignore */
  }
}

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "light" || stored === "dark") setMode(stored);
    } catch {
      /* ignore */
    }
  }, []);

  function cycle() {
    const next: Mode = mode === "system" ? "light" : mode === "light" ? "dark" : "system";
    setMode(next);
    apply(next);
  }

  const label = mode === "system" ? "auto" : mode;

  return (
    <button
      onClick={cycle}
      aria-label={`Theme: ${label}. Click to change.`}
      title={`Theme: ${label}`}
      className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
    >
      {mode === "dark" ? (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path
            d="M12.5 8.8A5.3 5.3 0 1 1 6.2 2.5 4.2 4.2 0 0 0 12.5 8.8Z"
            fill="currentColor"
          />
        </svg>
      ) : mode === "light" ? (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <circle cx="7.5" cy="7.5" r="3" fill="currentColor" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => (
            <line
              key={d}
              x1="7.5"
              y1="0.8"
              x2="7.5"
              y2="2.6"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              transform={`rotate(${d} 7.5 7.5)`}
            />
          ))}
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <rect
            x="1.5"
            y="2.5"
            width="12"
            height="8"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.3"
          />
          <path d="M5.5 13h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
