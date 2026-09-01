"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/** Ambient elevation-contour rings, top-right, drifting slowly on scroll. */
export function ContourField() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const apply = () => {
      frame = 0;
      el.style.transform = `translate3d(0, ${window.scrollY * 0.12}px, 0)`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute -right-40 -top-32 -z-[1] h-[42rem] w-[42rem] opacity-[0.5] dark:opacity-30"
    >
      <svg viewBox="0 0 600 600" fill="none" className="h-full w-full">
        {[260, 210, 165, 125, 90, 60].map((r, i) => (
          <path
            key={r}
            d={`M ${300 - r} 300
                C ${300 - r} ${300 - r * 0.75}, ${300 - r * 0.7} ${300 - r}, 300 ${300 - r}
                C ${300 + r * 0.8} ${300 - r}, ${300 + r} ${300 - r * 0.6}, ${300 + r} 300
                C ${300 + r} ${300 + r * 0.78}, ${300 + r * 0.65} ${300 + r}, 300 ${300 + r}
                C ${300 - r * 0.82} ${300 + r}, ${300 - r} ${300 + r * 0.62}, ${300 - r} 300 Z`}
            stroke="var(--lake)"
            strokeWidth="1"
            strokeOpacity={0.18 + i * 0.03}
          />
        ))}
      </svg>
    </div>
  );
}
