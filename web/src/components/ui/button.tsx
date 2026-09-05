import * as React from "react";

type Variant = "primary" | "accent" | "outline" | "ghost";
type Size = "md" | "lg";

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  const base =
    "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:pointer-events-none min-h-[44px]";
  const sizes = {
    md: "min-h-[44px] px-6 py-2.5 text-sm",
    lg: "min-h-[52px] px-8 py-3.5 text-base",
  };
  const variants = {
    primary:
      "bg-primary text-white hover:bg-primary-hover active:bg-primary-hover border border-primary",
    accent:
      "bg-accent text-text hover:bg-accent-hover active:bg-accent-hover border border-accent",
    outline:
      "bg-card text-text border border-border hover:bg-primary-soft active:bg-primary-soft",
    ghost: "bg-transparent text-muted hover:bg-primary-soft hover:text-text",
  };
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    />
  );
}
