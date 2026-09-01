import type { ComponentProps, ReactNode } from "react";

export const controlClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/25";

export const controlClassSm =
  "rounded-md border border-border bg-surface px-2 py-1 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25";

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
  return <span className="text-xs font-medium text-muted">{children}</span>;
}
