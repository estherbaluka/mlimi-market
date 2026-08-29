"use client";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BuyerCartPage() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const total = useCartStore((s) => s.total());

  if (items.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#fbfbf5] flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <p className="font-medium text-black">Your cart is empty.</p>
          <p className="mt-1 text-sm text-zinc-600">Add products to request an order without payment.</p>
          <Link href="/products" className="mt-4 inline-flex rounded-full bg-black px-6 py-2 text-sm font-medium text-white hover:bg-zinc-800">Browse Products</Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#fbfbf5]">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-black">Cart</h1>
        <p className="mt-1 text-sm text-zinc-600">{items.length} item(s) · Total {total.toLocaleString()} MWK</p>

        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <Card key={item.productId} className="flex gap-4 p-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageUrl || `https://picsum.photos/seed/${item.productId}/200/200`} alt={item.title} className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-1 flex-col">
                <p className="font-medium text-black">{item.title}</p>
                <p className="text-sm text-zinc-600">{item.price.toLocaleString()} {item.currency}/{item.unit} · {item.availableStock} available</p>
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="h-8 w-8 rounded-full border border-zinc-200 bg-white text-sm hover:bg-zinc-50" aria-label="Decrease quantity">−</button>
                  <span className="min-w-8 text-center text-sm font-medium text-black">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} disabled={item.quantity >= item.availableStock} className="h-8 w-8 rounded-full border border-zinc-200 bg-white text-sm hover:bg-zinc-50 disabled:opacity-50" aria-label="Increase quantity">+</button>
                  <span className="ml-2 text-sm text-zinc-600">{(item.price * item.quantity).toLocaleString()} MWK</span>
                </div>
              </div>
              <button onClick={() => removeItem(item.productId)} className="self-start text-sm font-medium text-red-600 hover:underline">Remove</button>
            </Card>
          ))}
        </div>

        <Card className="mt-6">
          <div className="flex items-center justify-between">
            <span className="font-medium text-black">Cart total</span>
            <span className="text-lg font-semibold text-black">{total.toLocaleString()} MWK</span>
          </div>
          <div className="mt-4 flex gap-3">
            <Link href="/buyer/checkout" className="flex-1 rounded-full bg-black px-6 py-3 text-center text-sm font-medium text-white hover:bg-zinc-800">Place Order</Link>
            <Button variant="outline" onClick={clearCart}>Clear cart</Button>
          </div>
          <p className="mt-3 text-xs text-zinc-500">No payment required. Your order will be sent as a request to farmers.</p>
        </Card>
      </div>
    </div>
  );
}
