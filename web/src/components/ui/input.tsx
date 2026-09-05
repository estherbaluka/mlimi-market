import * as React from "react";

export function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`flex min-h-[44px] w-full rounded-md border border-border bg-card px-4 py-2.5 text-base text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

export function Label({
  className = "",
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`text-sm font-medium text-text ${className}`}
      {...props}
    />
  );
}

export function Textarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`flex min-h-[88px] w-full rounded-md border border-border bg-card px-4 py-2.5 text-base text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

export function Select({
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`flex min-h-[44px] w-full rounded-md border border-border bg-card px-4 py-2.5 text-base text-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
