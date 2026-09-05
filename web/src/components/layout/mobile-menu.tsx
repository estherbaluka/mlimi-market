"use client";

import { useState } from "react";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";

type MenuUser = {
  role: "FARMER" | "BUYER" | "ADMIN";
  name: string | null;
  email: string;
} | null;

function linksFor(user: MenuUser): Array<{ href: string; label: string }> {
  const links = [{ href: "/products", label: "Products" }];
  if (!user) return links;
  if (user.role === "BUYER") {
    links.push(
      { href: "/buyer/dashboard", label: "Dashboard" },
      { href: "/buyer/cart", label: "Cart" },
      { href: "/buyer/orders", label: "Orders" },
      { href: "/buyer/messages", label: "Messages" }
    );
  } else if (user.role === "FARMER") {
    links.push(
      { href: "/farmer/dashboard", label: "Dashboard" },
      { href: "/farmer/products", label: "My Products" },
      { href: "/farmer/orders", label: "Orders" },
      { href: "/farmer/messages", label: "Messages" }
    );
  } else {
    links.push({ href: "/admin/dashboard", label: "Dashboard" });
  }
  return links;
}

export function MobileMenu({ user }: { user: MenuUser }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const links = linksFor(user);

  return (
    <div
      className="md:hidden"
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md px-3 py-2 text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        )}
      </button>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile navigation" className="absolute inset-x-0 top-full border-b border-border bg-card shadow-md">
          <ul className="mx-auto max-w-6xl space-y-1 px-4 py-3">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={close}
                  className="flex min-h-[44px] items-center rounded-md px-3 py-2 text-base font-medium text-text hover:bg-primary-soft"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            {user ? (
              <>
                <li className="px-3 py-2 text-sm text-muted truncate">
                  Signed in as {user.name || user.email}
                </li>
                <li>
                  <LogoutButton variant="outline" className="w-full min-h-[44px]" />
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link href="/login" onClick={close} className="flex min-h-[44px] items-center rounded-md border border-border bg-card px-3 py-2 text-base font-medium text-text hover:bg-primary-soft">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link href="/register" onClick={close} className="flex min-h-[44px] items-center rounded-md bg-primary px-3 py-2 text-base font-medium text-white hover:bg-primary-hover">
                    Create account
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      )}
    </div>
  );
}
