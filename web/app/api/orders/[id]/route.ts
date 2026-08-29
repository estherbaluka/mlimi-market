// @ts-nocheck
import { NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const statusSchema = z.object({ status: z.enum(["SUBMITTED","ACCEPTED","REJECTED","PREPARING","READY_FOR_PICKUP","OUT_FOR_DELIVERY","DELIVERED","CANCELLED"]) });

// Allowed transitions for farmer
const farmerTransitions: Record<string, string[]> = {
  SUBMITTED: ["ACCEPTED","REJECTED"],
  ACCEPTED: ["PREPARING","REJECTED"],
  PREPARING: ["READY_FOR_PICKUP","OUT_FOR_DELIVERY"],
  READY_FOR_PICKUP: ["OUT_FOR_DELIVERY","DELIVERED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
};

export async function GET(_req: Request, { params }: { params: Promise<{ id:string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const { id } = await params;
    const orderId = Number(id);
    if (Number.isNaN(orderId)) return NextResponse.json({ error: "Invalid order id" }, { status: 400 });

    const rows = await db.orm.public.Order.where({ id: orderId }).select("id","buyerId","status","deliveryMethod","deliveryAddress","pickupLocation","buyerNote","totalAmount","currency","createdAt","updatedAt").all();
    const order = rows[0] as unknown as Record<string,unknown>|undefined;
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Auth: buyer owns order, farmer has product in order, admin all
    let authorized = false;
    if (session.role === "ADMIN") authorized = true;
    else if (session.role === "BUYER" && order.buyerId === session.userId) authorized = true;
    else if (session.role === "FARMER") {
      const items = await db.orm.public.OrderItem.where({ orderId }).select("productId").all() as unknown as Array<{ productId:number }>;
      for (const it of items) {
        const prods = await db.orm.public.Product.where({ id: it.productId }).select("farmerId").all() as unknown as Array<{ farmerId:number }>;
        if (prods[0]?.farmerId === session.userId) { authorized = true; break; }
      }
    }
    if (!authorized) return NextResponse.json({ error: "You are not allowed to view this order." }, { status: 403 });

    const items = await db.orm.public.OrderItem.where({ orderId }).select("id","productId","productNameSnapshot","unitPriceSnapshot","quantity","unit").all();
    const buyerRows = await db.orm.public.User.where({ id: order.buyerId as number }).select("id","name","email","phone").all();
    const buyer = buyerRows[0] || null;

    return NextResponse.json({ order: { ...order, items, buyer } });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Something went wrong." }, { status: 500 }); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id:string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const { id } = await params;
    const orderId = Number(id);
    if (Number.isNaN(orderId)) return NextResponse.json({ error: "Invalid order id" }, { status: 400 });

    const body = await request.json();
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid status", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    const nextStatus = parsed.data.status;

    const rows = await db.orm.public.Order.where({ id: orderId }).select("id","buyerId","status","deliveryMethod").all();
    const order = rows[0] as unknown as { id:number; buyerId:number; status:string; deliveryMethod:string }|undefined;
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const current = order.status;

    // Buyer can only cancel
    if (session.role === "BUYER") {
      if (order.buyerId !== session.userId) return NextResponse.json({ error: "Not your order" }, { status: 403 });
      if (nextStatus !== "CANCELLED") return NextResponse.json({ error: "Buyers can only cancel orders." }, { status: 403 });
      if (!["SUBMITTED","ACCEPTED"].includes(current)) return NextResponse.json({ error: `Cannot cancel order in ${current} status.` }, { status: 400 });
      await db.orm.public.Order.where({ id: orderId }).update({ status: nextStatus });
      return NextResponse.json({ message: "Order cancelled successfully." });
    }

    if (session.role === "FARMER") {
      // Verify farmer owns at least one product in order
      const items = await db.orm.public.OrderItem.where({ orderId }).select("productId").all() as unknown as Array<{ productId:number }>;
      let isFarmerOrder = false;
      for (const it of items) {
        const prods = await db.orm.public.Product.where({ id: it.productId }).select("farmerId").all() as unknown as Array<{ farmerId:number }>;
        if (prods[0]?.farmerId === session.userId) { isFarmerOrder = true; break; }
      }
      if (!isFarmerOrder) return NextResponse.json({ error: "This order does not contain your products." }, { status: 403 });

      const allowed = farmerTransitions[current] || [];
      if (!allowed.includes(nextStatus)) return NextResponse.json({ error: `Cannot transition from ${current} to ${nextStatus}. Allowed: ${allowed.join(", ") || "none"}` }, { status: 400 });

      // Delivery method guard: READY_FOR_PICKUP only for PICKUP orders? allow but hint
      await db.orm.public.Order.where({ id: orderId }).update({ status: nextStatus });
      return NextResponse.json({ message: `Order ${nextStatus.toLowerCase()} successfully.` });
    }

    if (session.role === "ADMIN") {
      await db.orm.public.Order.where({ id: orderId }).update({ status: nextStatus });
      return NextResponse.json({ message: "Order status updated." });
    }

    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Something went wrong." }, { status: 500 }); }
}
