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
    // ignore
  }
}

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "light" || stored === "dark") setMode(stored);
    } catch {
      // ignore
    }
  }, []);

  function cycle() {
    const next: Mode = mode === "system" ? "light" : mode === "light" ? "dark" : "system";
    setMode(next);
    apply(next);
  }

  const icon = mode === "dark" ? "🌙" : mode === "light" ? "☀️" : "🖥️";

  return (
    <button
      onClick={cycle}
      aria-label={`Theme: ${mode}. Click to change.`}
      title={`Theme: ${mode}`}
      className="rounded-md p-1.5 text-sm hover:bg-surface-2"
    >
      {icon}
    </button>
  );
}
