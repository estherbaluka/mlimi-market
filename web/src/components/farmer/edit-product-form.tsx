// @ts-nocheck
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  title: z.string().trim().min(3, "Product title is required"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  category: z.string().trim().min(2, "Category is required"),
  price: z.coerce.number().positive("Price must be greater than zero"),
  currency: z.string().trim().default("MWK"),
  unit: z.string().trim().min(1, "Unit is required"),
  stockQuantity: z.coerce.number().int().min(0, "Stock cannot be negative"),
  status: z.enum(["ACTIVE","HIDDEN","SOLD_OUT"]),
  imageUrl: z.string().trim().url("Invalid URL").optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

export function EditProductForm({ product }: { product: { id:number; title:string; description:string|null; category:string; price:number; currency:string; unit:string; stockQuantity:number; status:string; imageUrl:string } }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string|null>(null);
  const { register, handleSubmit, formState:{ errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues:{ title: product.title, description: product.description||"", category: product.category, price: product.price, currency: product.currency, unit: product.unit, stockQuantity: product.stockQuantity, status: product.status as FormValues["status"], imageUrl: product.imageUrl }});

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const res = await fetch(`/api/products/${product.id}`, { method:"PATCH", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ ...values, images: values.imageUrl ? [values.imageUrl] : [] })});
      const data = await res.json();
      if (!res.ok) {
        if (data.details) { const first = Object.values(data.details).flat()[0] as string|undefined; setServerError(first || data.error); } else setServerError(data.error || "Update failed");
        return;
      }
      router.push("/farmer/products");
      router.refresh();
    } catch { setServerError("Something went wrong. Please try again."); }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {serverError && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</div>}
      <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" {...register("title")} />{errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}</div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label htmlFor="category">Category</Label><Select id="category" {...register("category")}><option value="">Select</option>{["Vegetables","Fruits","Grains","Tubers","Legumes","Dairy","Poultry","Honey","Herbs"].map((c)=>(<option key={c} value={c}>{c}</option>))}</Select>{errors.category && <p className="text-sm text-red-600">{errors.category.message}</p>}</div>
        <div className="space-y-2"><Label htmlFor="unit">Unit</Label><Select id="unit" {...register("unit")}><option value="kg">kg</option><option value="sack">sack</option><option value="basket">basket</option><option value="piece">piece</option><option value="litre">litre</option><option value="dozen">dozen</option><option value="bundle">bundle</option></Select>{errors.unit && <p className="text-sm text-red-600">{errors.unit.message}</p>}</div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label htmlFor="price">Price (MWK)</Label><Input id="price" type="number" {...register("price")} />{errors.price && <p className="text-sm text-red-600">{errors.price.message}</p>}</div>
        <div className="space-y-2"><Label htmlFor="stockQuantity">Stock</Label><Input id="stockQuantity" type="number" {...register("stockQuantity")} />{errors.stockQuantity && <p className="text-sm text-red-600">{errors.stockQuantity.message}</p>}</div>
      </div>
      <div className="space-y-2"><Label htmlFor="status">Status</Label><Select id="status" {...register("status")}><option value="ACTIVE">ACTIVE</option><option value="HIDDEN">HIDDEN</option><option value="SOLD_OUT">SOLD_OUT</option></Select></div>
      <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" {...register("description")} /></div>
      <div className="space-y-2"><Label htmlFor="imageUrl">Image URL</Label><Input id="imageUrl" {...register("imageUrl")} />{errors.imageUrl && <p className="text-sm text-red-600">{errors.imageUrl.message}</p>}</div>
      <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">{isSubmitting ? "Saving..." : "Save Changes"}</Button>
    </form>
  );
}
