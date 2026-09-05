import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { db } from "@/prisma/db";

export default async function BuyerOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "BUYER") redirect(`/${user.role.toLowerCase()}/dashboard`);

  let orders: Array<{ id:number; status:string; totalAmount:number; currency:string; createdAt:string; items:Array<{ productNameSnapshot:string; quantity:number; unit:string; unitPriceSnapshot:number }> }> = [];
  try {
    const rows = await db.orm.public.Order.where({ buyerId: user.id }).select("id","status","totalAmount","currency","createdAt").all() as unknown as Array<{ id:number; status:string; totalAmount:number; currency:string; createdAt:string }>;
    const enriched: typeof orders = await Promise.all(rows.map(async (o) => {
      const items = await db.orm.public.OrderItem.where({ orderId: o.id }).select("productNameSnapshot","quantity","unit","unitPriceSnapshot").all() as unknown as typeof orders[number]["items"];
      return { ...o, items };
    }));
    orders = enriched.sort((a: typeof orders[number], b: typeof orders[number])=> new Date(String(b.createdAt)).getTime()-new Date(String(a.createdAt)).getTime());
  } catch {}

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-page">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-text">My Orders</h1>
        <p className="mt-1 text-sm text-muted">Track your order requests.</p>

        {orders.length === 0 ? (
          <Card className="mt-6 text-center"><p className="font-medium text-text">You have no orders yet.</p><Link href="/products" className="mt-3 inline-flex rounded-full bg-primary px-6 py-2 text-sm text-white">Browse Products</Link></Card>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((o) => (
              <Card key={o.id} className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-text">Order #{o.id}</span>
                  <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-text">{o.status}</span>
                </div>
                <p className="mt-1 text-xs text-muted">{new Date(o.createdAt).toLocaleString()}</p>
                <ul className="mt-3 space-y-1 text-sm text-text">
                  {o.items.map((it,i)=>(<li key={i}>{it.productNameSnapshot} — {it.quantity} {it.unit} × {it.unitPriceSnapshot.toLocaleString()} UGX</li>))}
                </ul>
                <p className="mt-3 font-semibold text-text">Total {o.totalAmount.toLocaleString()} {o.currency}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
