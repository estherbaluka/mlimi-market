// @ts-nocheck
import { getCurrentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/prisma/db";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { FarmerOrderActions } from "@/components/farmer/order-actions";

export default async function FarmerOrderDetailPage({ params }: { params: Promise<{ id:string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "FARMER") redirect(`/${user.role.toLowerCase()}/dashboard`);
  const { id } = await params;
  const orderId = Number(id);
  if (Number.isNaN(orderId)) notFound();

  let order: Record<string,unknown>|null = null;
  let items: Array<Record<string,unknown>> = [];
  let buyer: Record<string,unknown>|null = null;
  try {
    const rows = await db.orm.public.Order.where({ id: orderId }).select("id","buyerId","status","deliveryMethod","deliveryAddress","pickupLocation","buyerNote","totalAmount","currency","createdAt").all() as unknown as Array<Record<string,unknown>>;
    const o = rows[0];
    if (!o) notFound();
    // verify farmer owns product
    const orderItems = await db.orm.public.OrderItem.where({ orderId }).select("productId").all() as unknown as Array<{ productId:number }>;
    let has = false;
    for (const it of orderItems) {
      const prods = await db.orm.public.Product.where({ id: it.productId }).select("farmerId").all() as unknown as Array<{ farmerId:number }>;
      if (prods[0]?.farmerId === user.id) { has=true; break; }
    }
    if (!has) redirect("/farmer/orders");
    order = o;
    items = await db.orm.public.OrderItem.where({ orderId }).select("productNameSnapshot","unitPriceSnapshot","quantity","unit","productId").all() as unknown as typeof items;
    const buyers = await db.orm.public.User.where({ id: o.buyerId as number }).select("id","name","email","phone").all() as unknown as Array<Record<string,unknown>>;
    buyer = buyers[0] || null;
  } catch (e){ console.error(e); notFound(); }

  if (!order) notFound();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-page">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/farmer/orders" className="text-sm font-medium text-text hover:underline">← Back to orders</Link>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-text">Order #{order.id as number}</h1>
            <p className="mt-1 text-sm text-muted">{new Date(String(order.createdAt)).toLocaleString()} · {order.deliveryMethod as string}</p>
          </div>
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-white">{order.status as string}</span>
        </div>

        <Card className="mt-6">
          <h2 className="font-medium text-text">Buyer</h2>
          <p className="mt-1 text-sm text-text">{(buyer?.name as string) || (buyer?.email as string)} {buyer?.phone ? `· ${buyer.phone}` : ""}</p>
          <p className="mt-1 text-sm text-muted">{buyer?.email as string}</p>
          {order.deliveryMethod === "DELIVERY" ? <p className="mt-3 text-sm text-text"><span className="font-medium">Delivery address:</span> {(order.deliveryAddress as string) || "—"}</p> : <p className="mt-3 text-sm text-text"><span className="font-medium">Pickup location:</span> {(order.pickupLocation as string) || "—"}</p>}
          {order.buyerNote && <p className="mt-2 text-sm text-muted"><span className="font-medium">Note:</span> {order.buyerNote as string}</p>}
        </Card>

        <Card className="mt-6">
          <h2 className="font-medium text-text">Items</h2>
          <ul className="mt-3 divide-y divide-border">
            {items.map((it,i)=>(
              <li key={i} className="flex justify-between py-2 text-sm"><span className="text-text">{it.productNameSnapshot as string} · {it.quantity as number} {it.unit as string}</span><span className="font-medium text-text">{((it.unitPriceSnapshot as number)*(it.quantity as number)).toLocaleString()} UGX</span></li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between font-semibold text-text"><span>Total</span><span>{(order.totalAmount as number).toLocaleString()} {(order.currency as string)}</span></div>
        </Card>

        <Card className="mt-6">
          <h2 className="font-medium text-text">Update status</h2>
          <p className="mt-1 text-sm text-muted">Move the order forward as you prepare it.</p>
          <div className="mt-4">
            <FarmerOrderActions orderId={orderId} currentStatus={order.status as string} deliveryMethod={order.deliveryMethod as string} />
          </div>
        </Card>
      </div>
    </div>
  );
}
