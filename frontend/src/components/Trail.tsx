"use client";

import { useEffect, useState } from "react";
import { useScrollProgress } from "@/lib/motion";

// Gentle hand-traced vertical path (viewBox 0 0 44 1000, stretched to viewport).
const PATH =
  "M22 0 C14 90 30 150 22 240 C15 320 32 380 22 470 C13 560 30 620 22 720 C15 800 30 860 22 1000";

const WAYPOINTS = [0.1, 0.37, 0.64, 0.9];

export function Trail() {
  const progress = useScrollProgress();
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  const p = reduced ? 1 : progress;

  return (
    <div className="trail-gutter" aria-hidden>
      <svg
        viewBox="0 0 44 1000"
        preserveAspectRatio="none"
        className="h-full w-full"
        fill="none"
      >
        <defs>
          <filter id="trail-glow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* faint full route */}
        <path
          d={PATH}
          stroke="var(--border)"
          strokeWidth="1.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* drawn portion */}
        <path
          d={PATH}
          stroke="var(--lake)"
          strokeWidth="2"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - p}
          style={{ transition: reduced ? "none" : "stroke-dashoffset 120ms linear" }}
        />

        {/* leading head */}
        {!reduced && p > 0.001 && p < 0.999 && (
          <>
            <circle cx="22" cy={p * 1000} r="10" fill="var(--sky)" filter="url(#trail-glow)" opacity="0.5" />
            <circle cx="22" cy={p * 1000} r="3" fill="var(--sky)" />
          </>
        )}

        {/* waypoints */}
        {WAYPOINTS.map((wy) => {
          const lit = p >= wy - 0.005;
          return (
            <g key={wy}>
              {lit && (
                <circle
                  cx="22"
                  cy={wy * 1000}
                  r="9"
                  fill="var(--lake)"
                  opacity="0.18"
                  filter="url(#trail-glow)"
                />
              )}
              <circle
                cx="22"
                cy={wy * 1000}
                r="4"
                fill={lit ? "var(--lake)" : "var(--background)"}
                stroke={lit ? "var(--lake)" : "var(--border)"}
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
                style={{ transition: reduced ? "none" : "fill 300ms var(--ease-out)" }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
