import type { ComponentProps } from "react";

/** Frosted panel. Liquid glass is reserved for chrome + key surfaces only. */
export function GlassCard({
  className = "",
  ...props
}: ComponentProps<"div">) {
  return <div className={`glass rounded-[22px] ${className}`} {...props} />;
}
