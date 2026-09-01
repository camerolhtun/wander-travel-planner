import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const base =
  "group/btn inline-flex items-center justify-center gap-2 rounded-full font-medium " +
  "transition-[background-color,color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] " +
  "disabled:opacity-55 disabled:pointer-events-none active:translate-y-px";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--lake)] text-white shadow-[0_8px_24px_-8px_rgba(23,60,82,0.5)] " +
    "hover:bg-[var(--lake-hover)] hover:shadow-[0_12px_30px_-8px_rgba(23,60,82,0.55)] hover:-translate-y-0.5",
  secondary: "glass text-foreground hover:text-[var(--lake)]",
  ghost: "text-muted hover:text-foreground hover:bg-surface-2",
  danger:
    "border border-[color-mix(in_oklab,var(--danger)_45%,transparent)] text-[var(--danger)] hover:bg-[color-mix(in_oklab,var(--danger)_12%,transparent)]",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

function Arrow() {
  return (
    <span
      className="grid size-5 place-items-center rounded-full bg-white/20 text-current transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/btn:rotate-45"
      aria-hidden
    >
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <path
          d="M2 9 L9 2 M9 2 H3.5 M9 2 V7.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  arrow = false,
  className = "",
  children,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size; arrow?: boolean }) {
  return (
    <button className={buttonClass(variant, size, className)} {...props}>
      {children as ReactNode}
      {arrow && <Arrow />}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  arrow = false,
  className = "",
  children,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size; arrow?: boolean }) {
  return (
    <Link className={buttonClass(variant, size, className)} {...props}>
      {children as ReactNode}
      {arrow && <Arrow />}
    </Link>
  );
}
