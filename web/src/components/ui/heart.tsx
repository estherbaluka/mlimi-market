import * as React from "react";

export function HeartIcon({ className = "", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={"inline-block w-4 h-4 text-red-500 " + className}
      {...props}
    >
      <path d="M12 21s-7-4.35-10-7.35C-0.5 9.5 3 4 8 6.5 10 7.9 12 10 12 10s2-2.1 4-3.5c5-2.5 8.5 3 6 7.15C19 16.65 12 21 12 21z" />
    </svg>
  );
}

export default HeartIcon;
