"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCartStore } from "@/store/cart";
import { Card } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const schema = z.object({
  deliveryMethod: z.enum(["PICKUP", "DELIVERY"]),
  deliveryAddress: z.string().trim().optional(),
  pickupLocation: z.string().trim().optional(),
  buyerNote: z.string().trim().max(500).optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  if (data.deliveryMethod === "DELIVERY" && !data.deliveryAddress?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Delivery address is required", path: ["deliveryAddress"] });
  }
  if (data.deliveryMethod === "PICKUP" && !data.pickupLocation?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Pickup location is required", path: ["pickupLocation"] });
  }
});

type FormValues = z.infer<typeof schema>;

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total());
  const clearCart = useCartStore((s) => s.clearCart);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { deliveryMethod: "DELIVERY" },
  });
  const method = watch("deliveryMethod");

  if (items.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#fbfbf5] flex items-center justify-center px-4">
        <Card className="text-center"><p className="font-medium text-black">Your cart is empty.</p><Link href="/products" className="mt-3 inline-flex rounded-full bg-black px-6 py-2 text-sm text-white">Browse Products</Link></Card>
      </div>
    );
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryMethod: values.deliveryMethod,
          deliveryAddress: values.deliveryAddress,
          pickupLocation: values.pickupLocation,
          buyerNote: values.buyerNote,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || "Failed to place order");
        return;
      }
      clearCart();
      router.push("/buyer/orders");
      router.refresh();
    } catch {
      setServerError("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#fbfbf5]">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-black">Submit Order</h1>
        <p className="mt-1 text-sm text-zinc-600">No payment — your request will be sent to farmers.</p>

        <Card className="mt-6">
          <h2 className="font-medium text-black">Order summary</h2>
          <ul className="mt-3 divide-y divide-zinc-200">
            {items.map((i) => (
              <li key={i.productId} className="flex justify-between py-2 text-sm"><span className="text-zinc-700">{i.title} × {i.quantity}</span><span className="font-medium text-black">{(i.price*i.quantity).toLocaleString()} MWK</span></li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between font-semibold text-black"><span>Total</span><span>{total.toLocaleString()} MWK</span></div>
        </Card>

        <Card className="mt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {serverError && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</div>}

            <div className="space-y-2">
              <Label htmlFor="deliveryMethod">Delivery method</Label>
              <Select id="deliveryMethod" {...register("deliveryMethod")}>
                <option value="DELIVERY">Delivery — deliver to my address</option>
                <option value="PICKUP">Pickup — I will collect</option>
              </Select>
              {errors.deliveryMethod && <p className="text-sm text-red-600">{errors.deliveryMethod.message}</p>}
            </div>

            {method === "DELIVERY" ? (
              <div className="space-y-2">
                <Label htmlFor="deliveryAddress">Delivery address</Label>
                <Input id="deliveryAddress" placeholder="Area 47, Lilongwe" {...register("deliveryAddress")} />
                {errors.deliveryAddress && <p className="text-sm text-red-600">{errors.deliveryAddress.message}</p>}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="pickupLocation">Pickup location</Label>
                <Input id="pickupLocation" placeholder="Farm or market pickup point" {...register("pickupLocation")} />
                {errors.pickupLocation && <p className="text-sm text-red-600">{errors.pickupLocation.message}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="buyerNote">Note for farmer (optional)</Label>
              <Textarea id="buyerNote" placeholder="Any delivery instructions..." {...register("buyerNote")} />
            </div>

            <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">{isSubmitting ? "Placing order..." : "Place Order"}</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
