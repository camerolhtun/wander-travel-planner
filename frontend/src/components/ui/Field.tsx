import type { ComponentProps, ReactNode } from "react";

export const controlClass =
  "w-full rounded-xl border border-border bg-surface/70 px-3.5 py-2.5 text-sm outline-none " +
  "transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-muted " +
  "focus:border-[var(--lake)] focus:bg-surface focus:ring-4 focus:ring-[color-mix(in_oklab,var(--sky)_45%,transparent)]";

export const controlClassSm =
  "rounded-lg border border-border bg-surface/70 px-2.5 py-1.5 text-sm outline-none " +
  "transition-[border-color,box-shadow] duration-200 " +
  "focus:border-[var(--lake)] focus:ring-4 focus:ring-[color-mix(in_oklab,var(--sky)_45%,transparent)]";

export function Label({
  children,
  className = "",
  ...props
}: ComponentProps<"label"> & { children: ReactNode }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`} {...props}>
      {children}
    </label>
  );
}

export function LabelText({ children }: { children: ReactNode }) {
  return (
    <span className="font-[var(--font-mono)] text-[0.7rem] uppercase tracking-[0.14em] text-muted">
      {children}
    </span>
  );
}
