"use client";
import Link from "next/link";
import { useCartStore } from "@/store/cart";

export function DashboardCartSummary() {
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total());
  const count = useCartStore((s) => s.count());

  if (items.length === 0) {
    return (
      <div>
        <p className="mt-2 text-sm text-muted">Your cart is empty.</p>
        <Link href="/products" className="mt-3 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="mt-2 text-sm text-muted">
        {count} item(s) · {total.toLocaleString()} UGX
      </p>
      <div className="mt-3 flex gap-2">
        <Link href="/buyer/cart" className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-text hover:bg-primary-soft">
          View Cart
        </Link>
        <Link href="/buyer/checkout" className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-hover">
          Place Order
        </Link>
      </div>
    </div>
  );
}
