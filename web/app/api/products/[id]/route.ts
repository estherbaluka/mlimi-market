// @ts-nocheck
import { NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { getSession } from "@/lib/auth";
import { updateProductSchema } from "@/lib/product-validations";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const productId = Number(id);
    if (Number.isNaN(productId)) return NextResponse.json({ error: "Invalid product id" }, { status: 400 });

    const products = await db.orm.public.Product.where({ id: productId })
      .select("id", "farmerId", "title", "description", "category", "price", "currency", "unit", "stockQuantity", "status", "createdAt", "updatedAt")
      .all();
    const product = products[0] as unknown as Record<string, unknown> | undefined;
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    let farmer: Record<string, unknown> | null = null;
    let images: Array<Record<string, unknown>> = [];
    try {
      const users = await db.orm.public.User.where({ id: product.farmerId as number }).select("id", "name", "email").all();
      const u = users[0] as unknown as { id:number; name:string|null; email:string }|undefined;
      let fp: { farmName:string; location:string; bio:string|null }|null = null;
      try {
        const fps = await db.orm.public.FarmerProfile.where({ userId: product.farmerId as number }).select("farmName","location","bio").all();
        fp = fps[0] as unknown as typeof fp;
      } catch {}
      if (u) farmer = { id: u.id, name: u.name, email: u.email, farmName: fp?.farmName, location: fp?.location, bio: fp?.bio };
    } catch {}
    try {
      const imgs = await db.orm.public.ProductImage.where({ productId }).select("id","url","alt","isPrimary","createdAt").all();
      images = imgs as unknown as typeof images;
    } catch {}

    return NextResponse.json({ product: { ...product, farmer, images } });
  } catch (err) {
    console.error("GET /api/products/[id] error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "You are not allowed to perform this action." }, { status: 401 });
    const { id } = await params;
    const productId = Number(id);
    if (Number.isNaN(productId)) return NextResponse.json({ error: "Invalid product id" }, { status: 400 });

    const existing = await db.orm.public.Product.where({ id: productId }).select("id","farmerId","status").all();
    const prod = existing[0] as unknown as { id:number; farmerId:number; status:string }|undefined;
    if (!prod) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    if (prod.farmerId !== session.userId && session.role !== "ADMIN") return NextResponse.json({ error: "You are not allowed to perform this action." }, { status: 403 });

    const body = await request.json();
    const parsed = updateProductSchema.safeParse({
      ...body,
      price: body.price !== undefined ? Number(body.price) : undefined,
      stockQuantity: body.stockQuantity !== undefined ? Number(body.stockQuantity) : undefined,
    });
    if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });

    const data = parsed.data;
    // Build update payload removing undefined
    const payload: Record<string, unknown> = {};
    for (const [k,v] of Object.entries(data)) if (v !== undefined) payload[k] = v;

    if (Object.keys(payload).length > 0) {
      await db.orm.public.Product.where({ id: productId }).update(payload as never);
      // Handle images if provided
      if (payload.images && Array.isArray(payload.images)) {
        const urls = payload.images as string[];
        // simplistic: delete old and recreate
        try {
          const old = await db.orm.public.ProductImage.where({ productId }).select("id").all();
          for (const im of old as unknown as Array<{ id:number }>) {
            await db.orm.public.ProductImage.where({ id: im.id }).delete();
          }
          for (let i=0;i<urls.length;i++) {
            await db.orm.public.ProductImage.create({ productId, url: urls[i], alt: String(payload.title || "product"), isPrimary: i===0 });
          }
        } catch {}
      }
    }

    return NextResponse.json({ message: "Product updated successfully." });
  } catch (err) {
    console.error("PATCH /api/products/[id] error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "You are not allowed to perform this action." }, { status: 401 });
    const { id } = await params;
    const productId = Number(id);
    if (Number.isNaN(productId)) return NextResponse.json({ error: "Invalid product id" }, { status: 400 });

    const existing = await db.orm.public.Product.where({ id: productId }).select("id","farmerId").all();
    const prod = existing[0] as unknown as { id:number; farmerId:number }|undefined;
    if (!prod) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    if (prod.farmerId !== session.userId && session.role !== "ADMIN") return NextResponse.json({ error: "You are not allowed to perform this action." }, { status: 403 });

    await db.orm.public.Product.where({ id: productId }).delete();

    return NextResponse.json({ message: "Product deleted successfully." });
  } catch (err) {
    console.error("DELETE /api/products/[id] error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
