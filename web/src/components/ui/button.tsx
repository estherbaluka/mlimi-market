import * as React from "react";

type Variant = "primary" | "outline" | "ghost";
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
    "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:opacity-50 disabled:pointer-events-none";
  const sizes = {
    md: "h-10 px-6 text-sm",
    lg: "h-12 px-8 text-base",
  };
  const variants = {
    primary:
      "bg-black text-white hover:bg-zinc-800 active:bg-zinc-700 border border-black",
    outline:
      "bg-white text-black border border-zinc-200 hover:bg-zinc-50 active:bg-zinc-100",
    ghost: "bg-transparent text-zinc-700 hover:bg-zinc-100",
  };
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    />
  );
}
