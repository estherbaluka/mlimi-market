// @ts-nocheck
import { ProductCard } from "@/components/products/product-card";
import { Input, Label, Select } from "@/components/ui/input";
import Link from "next/link";
import { db } from "@/prisma/db";

type SearchProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

// Direct DB query for server component (avoids HTTP fetch during `next build`)
async function fetchProducts(params: Record<string, string | undefined>) {
  try {
    const q = (params.q || "").trim().toLowerCase();
    const category = (params.category || "").trim();
    const unit = (params.unit || "").trim();
    const minPrice = params.minPrice ? Number(params.minPrice) : undefined;
    const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;
    const sort = (params.sort || "newest").trim();
    const page = Math.max(1, Number(params.page || "1"));
    const limit = Math.min(24, Math.max(1, Number(params.limit || "12")));

    let products: Array<Record<string, unknown>> = [];
    try {
      const all = await db.orm.public.Product.where({ status: "ACTIVE" as const })
        .select("id", "farmerId", "title", "description", "category", "price", "currency", "unit", "stockQuantity", "status", "createdAt")
        .all();
      products = all as unknown as typeof products;
    } catch {
      return { products: [], total: 0, totalPages: 0, page, limit };
    }

    const enriched = await Promise.all(
      products.map(async (p) => {
        let farmer: Record<string, unknown> | null = null;
        let images: Array<Record<string, unknown>> = [];
        try {
          const users = await db.orm.public.User.where({ id: p.farmerId as number }).select("id", "name", "email").all();
          const u = users[0] as unknown as { name: string | null; email: string } | undefined;
          let fp: { farmName: string; location: string } | null = null;
          try {
            const fps = await db.orm.public.FarmerProfile.where({ userId: p.farmerId as number }).select("farmName", "location").all();
            fp = fps[0] as unknown as typeof fp;
          } catch {}
          if (u) farmer = { name: u.name, email: u.email, farmName: fp?.farmName, location: fp?.location };
        } catch {}
        try {
          const imgs = await db.orm.public.ProductImage.where({ productId: p.id as number }).select("url", "alt", "isPrimary").all();
          images = imgs as unknown as typeof images;
        } catch {}
        return { ...p, farmer, images } as Record<string, unknown>;
      })
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let filtered: any[] = enriched;
    if (q) filtered = filtered.filter((p) => String(p.title||"").toLowerCase().includes(q) || String(p.description||"").toLowerCase().includes(q) || String(p.category||"").toLowerCase().includes(q));
    if (category) filtered = filtered.filter((p) => String(p.category).toLowerCase() === category.toLowerCase());
    if (unit) filtered = filtered.filter((p) => String(p.unit).toLowerCase() === unit.toLowerCase());
    if (minPrice !== undefined && !Number.isNaN(minPrice)) filtered = filtered.filter((p) => Number(p.price) >= minPrice);
    if (maxPrice !== undefined && !Number.isNaN(maxPrice)) filtered = filtered.filter((p) => Number(p.price) <= maxPrice);
    if (sort === "price_asc") filtered.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === "price_desc") filtered.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sort === "oldest") filtered.sort((a, b) => new Date(String(a.createdAt)).getTime() - new Date(String(b.createdAt)).getTime());
    else filtered.sort((a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime());

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    return { products: filtered.slice(start, start+limit), total, totalPages, page, limit };
  } catch {
    return { products: [], total: 0, totalPages: 0, page: 1, limit: 12 };
  }
}

export default async function ProductsPage({ searchParams }: SearchProps) {
  const params = await searchParams;
  const data = await fetchProducts(params);
  const products: Array<{
    id: number; title: string; category: string; price: number; currency: string; unit: string; stockQuantity: number; status: string; images?: Array<{ url: string }>; farmer?: { name: string | null; farmName?: string; location?: string };
  }> = data.products || [];

  const categories = ["Vegetables", "Fruits", "Grains", "Tubers", "Legumes", "Dairy", "Poultry", "Honey", "Herbs"];
  const units = ["kg", "sack", "basket", "piece", "litre", "dozen", "bundle"];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#fbfbf5]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-black">Browse Products</h1>
          <p className="text-sm text-zinc-600">Fresh produce from farmers across Malawi. No online payment — place an order to request produce.</p>
        </div>

        <form className="mt-6 rounded-xl border border-zinc-200 bg-white p-4">
          <div className="grid gap-4 md:grid-cols-12">
            <div className="md:col-span-4 space-y-1">
              <Label htmlFor="q">Search</Label>
              <Input id="q" name="q" defaultValue={params.q || ""} placeholder="Tomatoes, maize, honey..." />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label htmlFor="category">Category</Label>
              <Select id="category" name="category" defaultValue={params.category || ""}>
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label htmlFor="unit">Unit</Label>
              <Select id="unit" name="unit" defaultValue={params.unit || ""}>
                <option value="">All units</option>
                {units.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </Select>
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label htmlFor="sort">Sort</Label>
              <Select id="sort" name="sort" defaultValue={params.sort || "newest"}>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="oldest">Oldest</option>
              </Select>
            </div>
            <div className="md:col-span-2 flex items-end gap-2">
              <button type="submit" className="h-10 w-full rounded-full bg-black px-6 text-sm font-medium text-white hover:bg-zinc-800">Apply</button>
              <Link href="/products" className="h-10 rounded-full border border-zinc-200 bg-white px-6 text-sm font-medium text-black hover:bg-zinc-50 inline-flex items-center justify-center">Clear</Link>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="minPrice">Min price (MWK)</Label>
              <Input id="minPrice" name="minPrice" type="number" defaultValue={params.minPrice || ""} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="maxPrice">Max price (MWK)</Label>
              <Input id="maxPrice" name="maxPrice" type="number" defaultValue={params.maxPrice || ""} placeholder="10000" />
            </div>
          </div>
        </form>

        <div className="mt-4 text-sm text-zinc-600">{data.total ?? 0} product(s) found</div>

        {products.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
            <p className="font-medium text-black">No products found.</p>
            <p className="mt-1 text-sm text-zinc-600">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {data.totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((n) => {
              const qs = new URLSearchParams(params as Record<string,string>);
              qs.set("page", String(n));
              return (
                <Link key={n} href={`/products?${qs.toString()}`} className={`h-9 min-w-9 rounded-full border px-4 inline-flex items-center justify-center text-sm font-medium ${String(params.page||"1")===String(n) ? "bg-black text-white border-black" : "bg-white text-black border-zinc-200 hover:bg-zinc-50"}`}>{n}</Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
