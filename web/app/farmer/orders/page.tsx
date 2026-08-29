// @ts-nocheck
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/prisma/db";
import { Card } from "@/components/ui/card";

const statusColors: Record<string,string> = {
  SUBMITTED:"bg-zinc-100 text-black",
  ACCEPTED:"bg-green-100 text-green-800",
  REJECTED:"bg-red-100 text-red-700",
  PREPARING:"bg-amber-100 text-amber-800",
  READY_FOR_PICKUP:"bg-green-100 text-green-800",
  OUT_FOR_DELIVERY:"bg-blue-100 text-blue-800",
  DELIVERED:"bg-green-100 text-green-800",
  CANCELLED:"bg-red-100 text-red-700",
};

export default async function FarmerOrdersPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "FARMER") redirect(`/${user.role.toLowerCase()}/dashboard`);
  const params = await searchParams;
  const filterStatus = params.status || "";

  // Load orders containing farmer's products
  let orders: Array<{ id:number; buyerId:number; status:string; deliveryMethod:string; totalAmount:number; currency:string; createdAt:string; buyerName:string|null; buyerEmail:string; items:Array<{ productNameSnapshot:string; quantity:number; unit:string }> }> = [];
  try {
    const allOrders = await db.orm.public.Order.select("id","buyerId","status","deliveryMethod","totalAmount","currency","createdAt").all() as unknown as Array<{ id:number; buyerId:number; status:string; deliveryMethod:string; totalAmount:number; currency:string; createdAt:string }>;
    const filteredOrders: typeof allOrders = [];
    for (const o of allOrders) {
      const items = await db.orm.public.OrderItem.where({ orderId: o.id }).select("productId").all() as unknown as Array<{ productId:number }>;
      let has = false;
      for (const it of items) {
        const prods = await db.orm.public.Product.where({ id: it.productId }).select("farmerId").all() as unknown as Array<{ farmerId:number }>;
        if (prods[0]?.farmerId === user.id) { has = true; break; }
      }
      if (has) filteredOrders.push(o);
    }
    let list = filteredOrders;
    if (filterStatus) list = list.filter((o)=> o.status===filterStatus);
    list.sort((a,b)=> new Date(String(b.createdAt)).getTime()-new Date(String(a.createdAt)).getTime());
    orders = await Promise.all(list.map(async (o)=>{
      const items = await db.orm.public.OrderItem.where({ orderId: o.id }).select("productNameSnapshot","quantity","unit").all() as unknown as Array<{ productNameSnapshot:string; quantity:number; unit:string }>;
      const buyers = await db.orm.public.User.where({ id: o.buyerId }).select("name","email").all() as unknown as Array<{ name:string|null; email:string }>;
      const b = buyers[0];
      return { ...o, buyerName: b?.name || null, buyerEmail: b?.email || "", items };
    }));
  } catch (e){ console.error(e); }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#fbfbf5]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-black">Order Requests</h1>
            <p className="mt-1 text-sm text-zinc-600">Orders containing your products. Update status as you prepare.</p>
          </div>
          <form className="flex gap-2">
            <select name="status" defaultValue={filterStatus} className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm">
              <option value="">All statuses</option>
              {Object.keys(statusColors).map((s)=>(<option key={s} value={s}>{s}</option>))}
            </select>
            <button type="submit" className="h-10 rounded-full bg-black px-6 text-sm font-medium text-white">Filter</button>
          </form>
        </div>

        {orders.length===0 ? (
          <Card className="mt-6 text-center"><p className="font-medium text-black">No order requests.</p><p className="mt-1 text-sm text-zinc-600">When buyers order your produce, they will appear here.</p></Card>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((o)=>(
              <Card key={o.id} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-black">Order #{o.id} · {o.buyerName || o.buyerEmail}</p>
                    <p className="text-xs text-zinc-500">{new Date(o.createdAt).toLocaleString()} · {o.deliveryMethod}</p>
                    <ul className="mt-2 space-y-1 text-sm text-zinc-700">
                      {o.items.map((it,i)=>(<li key={i}>{it.productNameSnapshot} — {it.quantity} {it.unit}</li>))}
                    </ul>
                    <p className="mt-2 text-sm font-semibold text-black">{o.totalAmount.toLocaleString()} {o.currency}</p>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[o.status] || "bg-zinc-100"}`}>{o.status}</span>
                    <Link href={`/farmer/orders/${o.id}`} className="rounded-full border border-zinc-200 bg-white px-5 py-2 text-sm font-medium text-black hover:bg-zinc-50">View order</Link>
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
