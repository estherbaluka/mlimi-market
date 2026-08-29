"use client";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";

export function AddToCartButton({ product }: { product: { id: number | string; title: string; price: number; currency: string; unit: string; stockQuantity: number; images?: Array<{ url: string }> } }) {
  const addItem = useCartStore((s) => s.addItem);
  const disabled = product.stockQuantity <= 0;
  return (
    <Button
      disabled={disabled}
      onClick={() =>
        addItem({
          productId: String(product.id),
          title: product.title,
          price: product.price,
          currency: product.currency,
          unit: product.unit,
          quantity: 1,
          availableStock: product.stockQuantity,
          imageUrl: product.images?.[0]?.url,
        })
      }
      size="lg"
      className="w-full"
    >
      {disabled ? "Sold out" : "Add to cart"}
    </Button>
  );
}
