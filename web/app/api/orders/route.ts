// @ts-nocheck
import { NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const createOrderSchema = z.object({
  deliveryMethod: z.enum(["PICKUP", "DELIVERY"]),
  deliveryAddress: z.string().trim().optional().or(z.literal("")),
  pickupLocation: z.string().trim().optional().or(z.literal("")),
  buyerNote: z.string().trim().max(1000).optional().or(z.literal("")),
  items: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().positive() })).min(1, "Cart is empty").max(20),
}).superRefine((data, ctx) => {
  if (data.deliveryMethod === "DELIVERY" && !data.deliveryAddress?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Delivery address required", path: ["deliveryAddress"] });
  if (data.deliveryMethod === "PICKUP" && !data.pickupLocation?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Pickup location required", path: ["pickupLocation"] });
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "You are not allowed to perform this action." }, { status: 401 });
    if (session.role !== "BUYER") return NextResponse.json({ error: "Only buyers can place orders." }, { status: 403 });

    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });

    const { deliveryMethod, deliveryAddress, pickupLocation, buyerNote, items } = parsed.data;

    // Server-side price + stock validation
    let totalAmount = 0;
    const snapshots: Array<{ productId: number; productNameSnapshot: string; unitPriceSnapshot: number; quantity: number; unit: string }> = [];

    for (const item of items) {
      const pid = Number(item.productId);
      if (Number.isNaN(pid)) return NextResponse.json({ error: `Invalid product id: ${item.productId}` }, { status: 400 });
      const rows = await db.orm.public.Product.where({ id: pid }).select("id","title","price","currency","unit","stockQuantity","status").all();
      const product = rows[0] as unknown as { id:number; title:string; price:number; currency:string; unit:string; stockQuantity:number; status:string }|undefined;
      if (!product) return NextResponse.json({ error: `Product ${item.productId} not found.` }, { status: 404 });
      if (product.status !== "ACTIVE") return NextResponse.json({ error: `Product ${product.title} is no longer available.` }, { status: 400 });
      if (product.stockQuantity < item.quantity) return NextResponse.json({ error: `Insufficient stock for ${product.title}. Available: ${product.stockQuantity}` }, { status: 400 });
      totalAmount += product.price * item.quantity;
      snapshots.push({ productId: pid, productNameSnapshot: product.title, unitPriceSnapshot: product.price, quantity: item.quantity, unit: product.unit });
    }

    const order = await db.orm.public.Order.create({
      buyerId: session.userId,
      status: "SUBMITTED",
      deliveryMethod: deliveryMethod as "DELIVERY"|"PICKUP",
      deliveryAddress: deliveryMethod === "DELIVERY" ? deliveryAddress || null : null,
      pickupLocation: deliveryMethod === "PICKUP" ? pickupLocation || null : null,
      buyerNote: buyerNote || null,
      totalAmount,
      currency: "UGX",
    });
    const orderId = (order as unknown as { id:number }).id;

    for (const s of snapshots) {
      await db.orm.public.OrderItem.create({
        orderId,
        productId: s.productId,
        productNameSnapshot: s.productNameSnapshot,
        unitPriceSnapshot: s.unitPriceSnapshot,
        quantity: s.quantity,
        unit: s.unit,
      });
    }

    // Optionally reduce stock — MVP: reserve by not reducing yet, or reduce slightly
    // We will decrement stockQuantity to reflect reservation (best effort)
    for (const s of snapshots) {
      try {
        const rows = await db.orm.public.Product.where({ id: s.productId }).select("stockQuantity").all();
        const cur = (rows[0] as unknown as { stockQuantity:number })?.stockQuantity ?? 0;
        const next = Math.max(0, cur - s.quantity);
        // try ORM update
        // @ts-expect-error
        await db.orm.public.Product.where({ id: s.productId }).update({ stockQuantity: next, status: next===0 ? "SOLD_OUT" : undefined });
      } catch {}
    }

    return NextResponse.json({ message: "Order submitted successfully.", order: { id: orderId, totalAmount, status: "SUBMITTED" } }, { status: 201 });
  } catch (err) {
    console.error("POST /api/orders error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "You are not allowed to perform this action." }, { status: 401 });

    let orders: Array<Record<string, unknown>> = [];
    if (session.role === "BUYER") {
      const rows = await db.orm.public.Order.where({ buyerId: session.userId }).select("id","buyerId","status","deliveryMethod","deliveryAddress","pickupLocation","buyerNote","totalAmount","currency","createdAt","updatedAt").all();
      orders = rows as unknown as typeof orders;
    } else if (session.role === "FARMER") {
      // Farmer sees orders containing their products
      const allOrders = await db.orm.public.Order.select("id","buyerId","status","deliveryMethod","deliveryAddress","pickupLocation","buyerNote","totalAmount","currency","createdAt","updatedAt").all();
      // filter by orderItems containing farmerId products
      const filtered: typeof orders = [];
      for (const o of allOrders as unknown as Array<Record<string,unknown>>) {
        const items = await db.orm.public.OrderItem.where({ orderId: o.id as number }).select("productId").all();
        let hasFarmerProduct = false;
        for (const it of items as unknown as Array<{ productId:number }>) {
          const prods = await db.orm.public.Product.where({ id: it.productId }).select("farmerId").all();
          if ((prods[0] as unknown as { farmerId:number } | undefined)?.farmerId === session.userId) { hasFarmerProduct = true; break; }
        }
        if (hasFarmerProduct) filtered.push(o);
      }
      orders = filtered;
    } else {
      // ADMIN sees all
      const rows = await db.orm.public.Order.select("id","buyerId","status","deliveryMethod","deliveryAddress","pickupLocation","buyerNote","totalAmount","currency","createdAt","updatedAt").all();
      orders = rows as unknown as typeof orders;
    }

    // attach items
    const enriched = await Promise.all(orders.map(async (o) => {
      const items = await db.orm.public.OrderItem.where({ orderId: o.id as number }).select("id","productId","productNameSnapshot","unitPriceSnapshot","quantity","unit").all();
      return { ...o, items };
    }));

    enriched.sort((a,b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime());
    return NextResponse.json({ orders: enriched });
  } catch (err) {
    console.error("GET /api/orders error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
