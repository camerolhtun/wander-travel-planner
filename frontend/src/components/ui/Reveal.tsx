"use client";

import type { ElementType, ReactNode } from "react";
import { useInView } from "@/lib/motion";

/**
 * Wraps content in the `.reveal` transition (slide-up + fade) that fires once
 * when it scrolls into view. `delay` staggers siblings. Honours reduced motion
 * via the CSS in globals.
 */
export function Reveal({
  children,
  as,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
}) {
  const Tag = (as ?? "div") as ElementType;
  const { ref, shown } = useInView<HTMLElement>();

  return (
    <Tag
      ref={ref}
      data-shown={shown}
      style={{ ["--reveal-delay" as string]: `${delay}ms` }}
      className={`reveal ${className}`}
    >
      {children}
    </Tag>
  );
}
