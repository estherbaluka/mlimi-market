// @ts-nocheck
import { getCurrentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/prisma/db";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { CancelOrderButton } from "@/components/orders/cancel-button";

export default async function BuyerOrderDetailPage({ params }: { params: Promise<{ id:string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "BUYER") redirect(`/${user.role.toLowerCase()}/dashboard`);
  const { id } = await params;
  const orderId = Number(id);
  if (Number.isNaN(orderId)) notFound();
  let order: Record<string,unknown>|null = null;
  let items: Array<Record<string,unknown>> = [];
  try {
    const rows = await db.orm.public.Order.where({ id: orderId }).select("id","buyerId","status","deliveryMethod","deliveryAddress","pickupLocation","buyerNote","totalAmount","currency","createdAt").all() as unknown as Array<Record<string,unknown>>;
    const o = rows[0];
    if (!o || o.buyerId !== user.id) notFound();
    order = o;
    items = await db.orm.public.OrderItem.where({ orderId }).select("productNameSnapshot","unitPriceSnapshot","quantity","unit").all() as unknown as typeof items;
  } catch { notFound(); }
  if (!order) notFound();
  const canCancel = ["SUBMITTED","ACCEPTED"].includes(order.status as string);
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-page">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/buyer/orders" className="text-sm font-medium text-text hover:underline">← Back to orders</Link>
        <div className="mt-4 flex items-start justify-between">
          <h1 className="text-2xl font-semibold text-text">Order #{order.id as number}</h1>
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-white">{order.status as string}</span>
        </div>
        <p className="mt-1 text-sm text-muted">{new Date(String(order.createdAt)).toLocaleString()} · {order.deliveryMethod as string}</p>
        <Card className="mt-6">
          <h2 className="font-medium text-text">Items</h2>
          <ul className="mt-3 divide-y divide-border">
            {items.map((it,i)=>(<li key={i} className="flex justify-between py-2 text-sm"><span>{it.productNameSnapshot as string} · {it.quantity as number} {it.unit as string}</span><span className="font-medium">{((it.unitPriceSnapshot as number)*(it.quantity as number)).toLocaleString()} UGX</span></li>))}
          </ul>
          <div className="mt-3 flex justify-between font-semibold"><span>Total</span><span>{(order.totalAmount as number).toLocaleString()} {(order.currency as string)}</span></div>
        </Card>
        <Card className="mt-6">
          <h2 className="font-medium text-text">Delivery</h2>
          {order.deliveryMethod === "DELIVERY" ? <p className="mt-1 text-sm text-text">{order.deliveryAddress as string}</p> : <p className="mt-1 text-sm text-text">{order.pickupLocation as string}</p>}
          {order.buyerNote && <p className="mt-2 text-sm text-muted">Note: {order.buyerNote as string}</p>}
        </Card>
        {canCancel && (
          <Card className="mt-6">
            <CancelOrderButton orderId={orderId} />
          </Card>
        )}
      </div>
    </div>
  );
}
