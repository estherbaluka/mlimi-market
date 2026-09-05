"use client";
import { ProductCard } from "@/components/products/product-card";
import { useCartStore } from "@/store/cart";

type HomeProduct = {
  id: number;
  title: string;
  category: string;
  price: number;
  currency: string;
  unit: string;
  stockQuantity: number;
  status: string;
  images?: Array<{ url: string }>;
  farmer?: { name?: string | null; farmName?: string; location?: string } | null;
};

export function HomepageProducts({ products }: { products: HomeProduct[] }) {
  const addItem = useCartStore((s) => s.addItem);

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
        <p className="font-medium text-text">No products listed yet.</p>
        <p className="mt-1 text-sm text-muted">Check back soon for fresh produce from farmers.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          onAddToCart={() =>
            addItem({
              productId: String(p.id),
              title: p.title,
              price: p.price,
              currency: p.currency,
              unit: p.unit,
              quantity: 1,
              availableStock: p.stockQuantity,
              imageUrl: p.images?.[0]?.url,
            })
          }
        />
      ))}
    </div>
  );
}
