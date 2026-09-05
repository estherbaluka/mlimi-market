// @ts-nocheck
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { db } from "@/prisma/db";
import { getCurrentUser } from "@/lib/auth";
import { StartConversationButton } from "@/components/messages/start-conversation";
import { ProductGallery } from "@/components/products/product-gallery";

type Props = { params: Promise<{ id: string }> };

async function fetchProduct(id: string) {
  try {
    const productId = Number(id);
    if (Number.isNaN(productId)) return null;
    const rows = await db.orm.public.Product.where({ id: productId }).select("id","farmerId","title","description","category","price","currency","unit","stockQuantity","status","createdAt").all();
    const product = rows[0] as unknown as { id:number; farmerId:number; title:string; description:string|null; category:string; price:number; currency:string; unit:string; stockQuantity:number; status:string }|undefined;
    if (!product) return null;
    let farmer: { id:number; name:string|null; email:string; farmName?:string; location?:string; bio?:string|null }|null = null;
    let images: Array<{ url:string; alt:string|null }> = [];
    try {
      const users = await db.orm.public.User.where({ id: product.farmerId }).select("id","name","email").all();
      const u = users[0] as unknown as { id:number; name:string|null; email:string }|undefined;
      let fp: { farmName:string; location:string; bio:string|null }|null = null;
      try {
        const fps = await db.orm.public.FarmerProfile.where({ userId: product.farmerId }).select("farmName","location","bio").all();
        fp = fps[0] as unknown as typeof fp;
      } catch {}
      if (u) farmer = { id: u.id, name: u.name, email: u.email, farmName: fp?.farmName, location: fp?.location, bio: fp?.bio };
    } catch {}
    try {
      const imgs = await db.orm.public.ProductImage.where({ productId }).select("url","alt","isPrimary").all() as unknown as typeof images;
      images = imgs;
    } catch {}
    return { ...product, images, farmer } as unknown as {
      id: number; title: string; description: string | null; category: string; price: number; currency: string; unit: string; stockQuantity: number; status: string;
      images?: Array<{ url: string; alt: string | null }>;
      farmer?: { name: string | null; email: string; farmName?: string; location?: string; bio?: string | null };
    };
  } catch { return null; }
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await fetchProduct(id);

  if (!product) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-page flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <p className="font-medium text-text">Product is no longer available.</p>
          <p className="mt-1 text-sm text-muted">The product may have been removed or hidden.</p>
          <Link href="/products" className="mt-4 inline-flex rounded-full bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-hover">Browse Products</Link>
        </Card>
      </div>
    );
  }

  const galleryImages = (product.images || []).map((img) => ({ url: img.url, alt: img.alt }));
  const soldOut = product.status === "SOLD_OUT" || product.stockQuantity <= 0;
  const user = await getCurrentUser();
  const farmerId = (product as unknown as { farmerId:number }).farmerId;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-page">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/products" className="text-sm font-medium text-text hover:underline">← Back to products</Link>
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <ProductGallery productId={product.id as number} title={product.title} images={galleryImages} />

          <div className="flex flex-col">
            <div className="rounded-xl border border-border bg-card p-6">
              <span className="inline-flex rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-text">{product.category}</span>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-text">{product.title}</h1>
              <p className="mt-1 text-sm text-muted">
                {product.farmer?.farmName || product.farmer?.name || "Unknown farm"} {product.farmer?.location ? `· ${product.farmer.location}` : ""}
              </p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-text">{product.price.toLocaleString()} {product.currency}</span>
                <span className="text-sm text-muted">per {product.unit}</span>
              </div>
              <p className="mt-2 text-sm">
                {soldOut ? <span className="text-red-600 font-medium">Sold out</span> : <span className="text-green-700 font-medium">{product.stockQuantity} {product.unit} available</span>}
                {product.status === "HIDDEN" && <span className="text-amber-600"> · Hidden</span>}
              </p>
              {product.description && <p className="mt-4 text-sm leading-6 text-text whitespace-pre-wrap">{product.description}</p>}

              <div className="mt-6 flex flex-col gap-3">
                <AddToCartButton product={product} />
                <Link href={`/products`} className="rounded-full border border-border bg-card px-6 py-3 text-center text-sm font-medium text-text hover:bg-primary-soft">Continue Shopping</Link>
              </div>

              <div className="mt-6 rounded-lg border border-border bg-primary-soft p-4">
                <p className="text-sm font-medium text-text">Farmer</p>
                <p className="text-sm text-text">{product.farmer?.name || "Unknown"} {product.farmer?.farmName ? `· ${product.farmer.farmName}` : ""}</p>
                {product.farmer?.bio && <p className="mt-1 text-sm text-muted">{product.farmer.bio}</p>}
                <p className="mt-1 text-sm text-muted">{product.farmer?.location}</p>
                {user && user.role==="BUYER" && user.id !== farmerId && (
                  <div className="mt-3">
                    <StartConversationButton farmerId={farmerId} productId={product.id as number} />
                  </div>
                )}
                {!user && (
                  <div className="mt-3">
                    <Link href="/login" className="rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-text hover:bg-primary-soft inline-flex">Sign in to message farmer</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
