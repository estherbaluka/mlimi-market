import Link from "next/link";
import { db } from "@/prisma/db";
import { HomepageProducts } from "@/components/products/homepage-products";

type HomeProduct = {
  id: number;
  title: string;
  category: string;
  price: number;
  currency: string;
  unit: string;
  stockQuantity: number;
  status: string;
  createdAt: string;
  images?: Array<{ url: string }>;
  farmer?: { name: string | null; farmName?: string; location?: string } | null;
};

async function fetchLatestProducts(limit = 8): Promise<HomeProduct[]> {
  try {
    let products: Array<Record<string, unknown>> = [];
    try {
      const rows = await db.orm.public.Product.where({ status: "ACTIVE" as const })
        .select("id", "farmerId", "title", "category", "price", "currency", "unit", "stockQuantity", "status", "createdAt")
        .all();
      products = rows as unknown as typeof products;
    } catch {
      return [];
    }

    const enriched = await Promise.all(
      products.map(async (p) => {
        let farmer: HomeProduct["farmer"] = null;
        let images: Array<{ url: string }> = [];
        try {
          const users = await db.orm.public.User.where({ id: p.farmerId as number }).select("id", "name").all();
          const u = users[0] as unknown as { name: string | null } | undefined;
          try {
            const fps = await db.orm.public.FarmerProfile.where({ userId: p.farmerId as number }).select("farmName", "location").all();
            const fp = fps[0] as unknown as { farmName: string; location: string } | undefined;
            if (u) farmer = { name: u.name, farmName: fp?.farmName, location: fp?.location };
          } catch {
            if (u) farmer = { name: u.name };
          }
        } catch {}
        try {
          const imgs = await db.orm.public.ProductImage.where({ productId: p.id as number }).select("url").all();
          images = imgs as unknown as typeof images;
        } catch {}
        return { ...p, farmer, images } as unknown as HomeProduct;
      })
    );

    return enriched
      .sort((a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime())
      .slice(0, limit);
  } catch {
    return [];
  }
}

export default async function Home() {
  const products = await fetchLatestProducts(8);
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero - flat forest green, no gradients */}
      <section className="bg-primary border-b border-primary-hover">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">Fresh produce, direct from farmers.</h1>
            <p className="mt-4 text-base leading-7 text-white/90">Mlimi Market connects farmers who list agricultural produce with buyers who want to purchase directly... no middlemen.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/products" className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-accent px-8 py-3.5 text-center text-base font-medium text-text hover:bg-accent-hover">Browse Products</Link>
              <Link href="/register" className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/40 bg-transparent px-8 py-3.5 text-center text-base font-medium text-white hover:bg-white/10">Create account</Link>
            </div>
            
          </div>
        </div>
      </section>

      <section className="bg-page">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-medium text-text">For Buyers</h3>
              <p className="mt-2 text-sm leading-6 text-muted">Browse, search, filter by category, price and unit. Add to cart, choose pickup or delivery, and place your order without payment.</p>
              <Link href="/buyer/dashboard" className="inline-link mt-4 inline-flex items-center py-2 text-sm font-medium text-primary hover:underline">Buyer dashboard →</Link>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-medium text-text">For Farmers</h3>
              <p className="mt-2 text-sm leading-6 text-muted">Register as a farmer, add products, manage stock and status, and handle incoming order requests.</p>
              <Link href="/farmer/dashboard" className="inline-link mt-4 inline-flex items-center py-2 text-sm font-medium text-primary hover:underline">Farmer dashboard →</Link>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-medium text-text">How it works</h3>
              <ol className="mt-2 list-decimal pl-4 text-sm leading-6 text-muted">
                <li>Farmer lists produce</li>
                <li>Buyer adds to cart and places order (status: SUBMITTED)</li>
                <li>Farmer accepts, prepares, and marks ready/delivered</li>
              </ol>
            </div>
          </div>

          <div className="mt-12 rounded-xl border border-border bg-card p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text">Fresh products</h2>
                <p className="mt-1 text-sm text-muted">Latest produce listed by farmers.</p>
              </div>
              <Link href="/products" className="inline-flex min-h-[44px] items-center text-sm font-medium text-primary hover:underline">
                Browse all products →
              </Link>
            </div>
            <div className="mt-6">
              <HomepageProducts products={products} />
            </div>
            {products.length > 0 && (
              <div className="mt-6 text-center">
                <Link href="/products" className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-primary px-8 py-3.5 text-base font-medium text-white hover:bg-primary-hover">
                  Browse Products
                </Link>
              </div>
            )}
          </div>

          <div className="mt-12 rounded-xl border border-border bg-card p-8">
            <h2 className="text-xl font-semibold text-text">Categories</h2>
            <p className="mt-1 text-sm text-muted">Vegetables · Fruits · Grains · Tubers · Legumes · Dairy · Poultry · Honey · Herbs</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Vegetables","Fruits","Grains","Tubers","Legumes","Dairy","Poultry","Honey","Herbs"].map((c) => (
                <Link key={c} href={`/products?category=${c}`} className="inline-flex min-h-[44px] items-center rounded-full bg-page border border-border px-4 py-2 text-sm font-medium text-text hover:bg-primary-soft">{c}</Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
