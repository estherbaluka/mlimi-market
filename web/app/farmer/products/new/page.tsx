// @ts-nocheck
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/products/image-uploader";

const schema = z.object({
  title: z.string().trim().min(3, "Product title is required"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  category: z.string().trim().min(2, "Category is required"),
  price: z.coerce.number().positive("Price must be greater than zero"),
  currency: z.string().trim().default("UGX"),
  unit: z.string().trim().min(1, "Unit is required"),
  stockQuantity: z.coerce.number().int().min(0, "Stock cannot be negative"),
  status: z.enum(["ACTIVE","HIDDEN","SOLD_OUT"]).default("ACTIVE"),
  images: z.array(z.string().min(1)).max(5, "At most 5 images allowed").min(1, "At least one product image is required"),
});

type FormValues = z.infer<typeof schema>;

export default function FarmerNewProductPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, control, formState:{ errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues:{ currency:"UGX", status:"ACTIVE", unit:"kg", images: [] }});

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const res = await fetch("/api/products", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify(values)});
      const data = await res.json();
      if (!res.ok) {
        if (data.details) { const first = Object.values(data.details).flat()[0] as string|undefined; setServerError(first || data.error); } else setServerError(data.error || "Failed to create product");
        return;
      }
      router.push("/farmer/products");
      router.refresh();
    } catch { setServerError("Something went wrong. Please try again."); }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-page">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/farmer/products" className="text-sm font-medium text-text hover:underline">← Back to products</Link>
        <h1 className="mt-4 text-2xl font-semibold text-text">Add Product</h1>
        <p className="mt-1 text-sm text-muted">List produce for buyers. Solid colors only.</p>
        <Card className="mt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {serverError && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</div>}
            <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" placeholder="Fresh Tomatoes" {...register("title")} />{errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="category">Category</Label><Select id="category" {...register("category")}><option value="">Select category</option>{["Vegetables","Fruits","Grains","Tubers","Legumes","Dairy","Poultry","Honey","Herbs"].map((c)=>(<option key={c} value={c}>{c}</option>))}</Select>{errors.category && <p className="text-sm text-red-600">{errors.category.message}</p>}</div>
              <div className="space-y-2"><Label htmlFor="unit">Unit</Label><Select id="unit" {...register("unit")}><option value="kg">kg</option><option value="sack">sack</option><option value="basket">basket</option><option value="piece">piece</option><option value="litre">litre</option><option value="dozen">dozen</option><option value="bundle">bundle</option></Select>{errors.unit && <p className="text-sm text-red-600">{errors.unit.message}</p>}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="price">Price (UGX)</Label><Input id="price" type="number" step="0.01" placeholder="2500" {...register("price")} />{errors.price && <p className="text-sm text-red-600">{errors.price.message}</p>}</div>
              <div className="space-y-2"><Label htmlFor="stockQuantity">Stock quantity</Label><Input id="stockQuantity" type="number" placeholder="100" {...register("stockQuantity")} />{errors.stockQuantity && <p className="text-sm text-red-600">{errors.stockQuantity.message}</p>}</div>
            </div>
            <div className="space-y-2"><Label htmlFor="currency">Currency</Label><Input id="currency" {...register("currency")} />{errors.currency && <p className="text-sm text-red-600">{errors.currency.message}</p>}</div>
            <div className="space-y-2"><Label htmlFor="description">Description (optional)</Label><Textarea id="description" placeholder="Fresh, organic..." {...register("description")} /></div>
            <div className="space-y-2">
              <Label htmlFor="product-images">Product images (required)</Label>
              <Controller
                control={control}
                name="images"
                render={({ field }) => <ImageUploader value={field.value || []} onChange={field.onChange} />}
              />
              {errors.images && <p className="text-sm text-red-600">{errors.images.message}</p>}
            </div>
            <div className="space-y-2"><Label htmlFor="status">Status</Label><Select id="status" {...register("status")}><option value="ACTIVE">ACTIVE</option><option value="HIDDEN">HIDDEN</option><option value="SOLD_OUT">SOLD_OUT</option></Select></div>
            <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">{isSubmitting ? "Creating..." : "Add Product"}</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
