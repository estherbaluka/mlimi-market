// @ts-nocheck
import { getCurrentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/prisma/db";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { EditProductForm } from "@/components/farmer/edit-product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "FARMER") redirect(`/${user.role.toLowerCase()}/dashboard`);
  const { id } = await params;
  const productId = Number(id);
  if (Number.isNaN(productId)) notFound();

  let product: Record<string, unknown> | null = null;
  try {
    const rows = await db.orm.public.Product.where({ id: productId }).select("id","farmerId","title","description","category","price","currency","unit","stockQuantity","status").all();
    const p = rows[0] as unknown as Record<string,unknown>|undefined;
    if (!p) notFound();
    if (p.farmerId !== user.id) redirect("/farmer/products");
    let images: string[] = [];
    try {
      const imgs = await db.orm.public.ProductImage.where({ productId }).select("url").all() as unknown as Array<{ url:string }>;
      images = imgs.map((i) => i.url).filter(Boolean);
    } catch {}
    product = { ...p, images };
  } catch { notFound(); }

  if (!product) notFound();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-page">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/farmer/products" className="text-sm font-medium text-text hover:underline">← Back to products</Link>
        <h1 className="mt-4 text-2xl font-semibold text-text">Edit Product</h1>
        <p className="mt-1 text-sm text-muted">Update your listing.</p>
        <Card className="mt-6">
          <EditProductForm product={product as { id:number; title:string; description:string|null; category:string; price:number; currency:string; unit:string; stockQuantity:number; status:string; images:string[] }} />
        </Card>
      </div>
    </div>
  );
}
