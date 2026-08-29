// @ts-nocheck
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/prisma/db";
import { Card } from "@/components/ui/card";
import { FarmerProductActions } from "@/components/farmer/product-actions";

export default async function FarmerProductsPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "FARMER") redirect(`/${user.role.toLowerCase()}/dashboard`);

  const params = await searchParams;
  const q = (params.q||"").toLowerCase().trim();
  const status = params.status || "";
  const category = params.category || "";

  let products: Array<{ id:number; title:string; category:string; price:number; currency:string; unit:string; stockQuantity:number; status:string; createdAt:string; images?: Array<{ url:string }> }> = [];
  try {
    const rows = await db.orm.public.Product.where({ farmerId: user.id }).select("id","title","category","price","currency","unit","stockQuantity","status","createdAt").all();
    let list = rows as unknown as typeof products;
    // enrich images
    list = await Promise.all(list.map(async (p) => {
      try {
        const imgs = await db.orm.public.ProductImage.where({ productId: p.id }).select("url").all() as unknown as Array<{ url:string }>;
        return { ...p, images: imgs };
      } catch { return { ...p, images: [] }; }
    }));
    if (q) list = list.filter((p) => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    if (status) list = list.filter((p) => p.status === status);
    if (category) list = list.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    list.sort((a,b)=> new Date(String(b.createdAt)).getTime()-new Date(String(a.createdAt)).getTime());
    products = list;
  } catch (e) { console.error(e); }

  const categories = ["Vegetables","Fruits","Grains","Tubers","Legumes","Dairy","Poultry","Honey","Herbs"];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#fbfbf5]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-black">My Products</h1>
            <p className="mt-1 text-sm text-zinc-600">{products.length} product(s)</p>
          </div>
          <Link href="/farmer/products/new" className="rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">Add Product</Link>
        </div>

        <form className="mt-6 rounded-xl border border-zinc-200 bg-white p-4">
          <div className="grid gap-4 md:grid-cols-4">
            <input name="q" defaultValue={params.q||""} placeholder="Search title or category" className="h-10 rounded-md border border-zinc-200 px-3 text-sm" />
            <select name="status" defaultValue={status} className="h-10 rounded-md border border-zinc-200 px-3 text-sm bg-white">
              <option value="">All statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="HIDDEN">HIDDEN</option>
              <option value="SOLD_OUT">SOLD_OUT</option>
            </select>
            <select name="category" defaultValue={category} className="h-10 rounded-md border border-zinc-200 px-3 text-sm bg-white">
              <option value="">All categories</option>
              {categories.map((c)=>(<option key={c} value={c}>{c}</option>))}
            </select>
            <button type="submit" className="h-10 rounded-full bg-black text-white text-sm font-medium">Filter</button>
          </div>
        </form>

        {products.length===0 ? (
          <Card className="mt-6 text-center"><p className="font-medium text-black">No products listed yet.</p><p className="mt-1 text-sm text-zinc-600">Add your first produce to start selling.</p><Link href="/farmer/products/new" className="mt-4 inline-flex rounded-full bg-black px-6 py-2 text-sm text-white">Add Product</Link></Card>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((p)=>(
              <Card key={p.id} className="p-0 overflow-hidden">
                <div className="aspect-[4/3] bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.images?.[0]?.url || `https://picsum.photos/seed/${p.id}/400/300`} alt={p.title} className="h-full w-full object-cover" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-black line-clamp-2">{p.title}</h3>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${p.status==="ACTIVE" ? "bg-green-100 text-green-800" : p.status==="HIDDEN" ? "bg-zinc-100 text-zinc-700" : "bg-red-100 text-red-700"}`}>{p.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">{p.category} · {p.price.toLocaleString()} {p.currency}/{p.unit}</p>
                  <p className="text-xs text-zinc-500">{p.stockQuantity} {p.unit} in stock</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/farmer/products/${p.id}/edit`} className="rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm font-medium text-black hover:bg-zinc-50">Edit</Link>
                    <FarmerProductActions product={p} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
