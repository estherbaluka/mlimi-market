// @ts-nocheck
import { NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { getSession } from "@/lib/auth";
import { createProductSchema } from "@/lib/product-validations";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim().toLowerCase() || "";
    const category = searchParams.get("category")?.trim() || "";
    const unit = searchParams.get("unit")?.trim() || "";
    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
    const sort = searchParams.get("sort")?.trim() || "newest";
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(24, Math.max(1, Number(searchParams.get("limit") || "12")));
    const statusFilter = searchParams.get("status")?.trim() || "ACTIVE";

    // Fetch products — Prisma 8: filter by status ACTIVE for public listing
    // Use in-memory filtering for search/price to keep query simple for MVP
    let products: Array<Record<string, unknown>> = [];
    try {
      const all = await db.orm.public.Product.where({ status: statusFilter as "ACTIVE" })
        .select("id", "farmerId", "title", "description", "category", "price", "currency", "unit", "stockQuantity", "status", "createdAt", "updatedAt")
        .all();
      products = all as unknown as Array<Record<string, unknown>>;
    } catch (e) {
      // fallback to empty if DB not signed/migrated yet
      console.error("Products fetch error:", e);
      return NextResponse.json({ products: [], total: 0, page, limit, totalPages: 0 });
    }

    // Enrich with farmer + images in parallel (best effort)
    const enriched = await Promise.all(
      products.map(async (p) => {
        let farmer: { name: string | null; email: string; farmName?: string; location?: string } | null = null;
        let images: Array<{ url: string; alt: string | null; isPrimary: boolean }> = [];
        try {
          const users = await db.orm.public.User.where({ id: p.farmerId as number })
            .select("id", "name", "email")
            .all();
          const u = (users[0] as unknown as { name: string | null; email: string } | undefined) || null;
          let fp: { farmName: string; location: string } | null = null;
          try {
            const fps = await db.orm.public.FarmerProfile.where({ userId: p.farmerId as number })
              .select("farmName", "location")
              .all();
            fp = (fps[0] as unknown as { farmName: string; location: string }) || null;
          } catch {}
          if (u) farmer = { name: u.name, email: u.email, farmName: fp?.farmName, location: fp?.location };
        } catch {}
        try {
          const imgs = await db.orm.public.ProductImage.where({ productId: p.id as number })
            .select("url", "alt", "isPrimary")
            .all();
          images = imgs as unknown as typeof images;
        } catch {}
        return { ...p, farmer, images };
      })
    );

    let filtered = enriched;

    if (q) {
      filtered = filtered.filter((p) => {
        const title = String(p.title || "").toLowerCase();
        const desc = String(p.description || "").toLowerCase();
        const cat = String(p.category || "").toLowerCase();
        return title.includes(q) || desc.includes(q) || cat.includes(q);
      });
    }
    if (category) filtered = filtered.filter((p) => String(p.category).toLowerCase() === category.toLowerCase());
    if (unit) filtered = filtered.filter((p) => String(p.unit).toLowerCase() === unit.toLowerCase());
    if (minPrice !== undefined && !Number.isNaN(minPrice)) filtered = filtered.filter((p) => Number(p.price) >= minPrice);
    if (maxPrice !== undefined && !Number.isNaN(maxPrice)) filtered = filtered.filter((p) => Number(p.price) <= maxPrice);

    // Sorting
    if (sort === "price_asc") filtered.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === "price_desc") filtered.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sort === "oldest") filtered.sort((a, b) => new Date(String(a.createdAt)).getTime() - new Date(String(b.createdAt)).getTime());
    else filtered.sort((a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime()); // newest

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return NextResponse.json({ products: paginated, total, page, limit, totalPages });
  } catch (err) {
    console.error("GET /api/products error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "You are not allowed to perform this action." }, { status: 401 });
    if (session.role !== "FARMER") return NextResponse.json({ error: "Only farmers can create products." }, { status: 403 });

    const body = await request.json();
    const parsed = createProductSchema.safeParse({
      ...body,
      price: typeof body.price === "string" ? Number(body.price) : body.price,
      stockQuantity: typeof body.stockQuantity === "string" ? Number(body.stockQuantity) : body.stockQuantity,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const data = parsed.data;

    const created = await db.orm.public.Product.create({
      farmerId: session.userId,
      title: data.title,
      description: data.description || null,
      category: data.category,
      price: data.price,
      currency: data.currency || "MWK",
      unit: data.unit,
      stockQuantity: data.stockQuantity,
      status: data.status as "ACTIVE",
    });
    const productId = (created as unknown as { id: number }).id;

    if (data.images && data.images.length > 0) {
      for (let i = 0; i < data.images.length; i++) {
        await db.orm.public.ProductImage.create({
          productId,
          url: data.images[i],
          alt: data.title,
          isPrimary: i === 0,
        });
      }
    }

    return NextResponse.json({ message: "Product created successfully.", product: { id: productId, ...data } }, { status: 201 });
  } catch (err) {
    console.error("POST /api/products error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
