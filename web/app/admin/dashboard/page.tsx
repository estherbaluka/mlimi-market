// @ts-nocheck
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { db } from "@/prisma/db";
import Link from "next/link";
import { AdminProductActions } from "@/components/admin/product-actions";

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(`/${user.role.toLowerCase()}/dashboard`);

  let stats = { users: 0, farmers: 0, buyers: 0, admins: 0, products: 0, active: 0, hidden: 0, soldOut: 0, orders: 0, submitted: 0, conversations: 0 };
  let users: Array<{ id:number; name:string|null; email:string; role:string; createdAt:string }> = [];
  let products: Array<{ id:number; title:string; category:string; price:number; status:string; farmerId:number; farmerName:string|null }> = [];
  let orders: Array<{ id:number; status:string; totalAmount:number; currency:string; createdAt:string; buyerEmail:string }> = [];

  try {
    const allUsers = await db.orm.public.User.select("id","name","email","role","createdAt").all() as unknown as typeof users;
    users = allUsers.slice(0,20);
    stats.users = allUsers.length;
    stats.farmers = allUsers.filter((u)=>u.role==="FARMER").length;
    stats.buyers = allUsers.filter((u)=>u.role==="BUYER").length;
    stats.admins = allUsers.filter((u)=>u.role==="ADMIN").length;
  } catch {}

  try {
    const allProducts = await db.orm.public.Product.select("id","title","category","price","status","farmerId").all() as unknown as Array<{ id:number; title:string; category:string; price:number; status:string; farmerId:number }>;
    stats.products = allProducts.length;
    stats.active = allProducts.filter((p)=>p.status==="ACTIVE").length;
    stats.hidden = allProducts.filter((p)=>p.status==="HIDDEN").length;
    stats.soldOut = allProducts.filter((p)=>p.status==="SOLD_OUT").length;
    // enrich 10 latest products with farmer name
    const latest = allProducts.slice(0,10);
    products = await Promise.all(latest.map(async (p)=>{
      try {
        const u = await db.orm.public.User.where({ id: p.farmerId }).select("name").all() as unknown as Array<{ name:string|null }>;
        return { ...p, farmerName: u[0]?.name || null };
      } catch { return { ...p, farmerName: null }; }
    }));
  } catch {}

  try {
    const allOrders = await db.orm.public.Order.select("id","status","totalAmount","currency","buyerId","createdAt").all() as unknown as Array<{ id:number; status:string; totalAmount:number; currency:string; buyerId:number; createdAt:string }>;
    stats.orders = allOrders.length;
    stats.submitted = allOrders.filter((o)=>o.status==="SUBMITTED").length;
    const latestOrders = allOrders.sort((a,b)=> new Date(String(b.createdAt)).getTime()-new Date(String(a.createdAt)).getTime()).slice(0,10);
    orders = await Promise.all(latestOrders.map(async (o)=>{
      try {
        const b = await db.orm.public.User.where({ id: o.buyerId }).select("email").all() as unknown as Array<{ email:string }>;
        return { id:o.id, status:o.status, totalAmount:o.totalAmount, currency:o.currency, createdAt:o.createdAt, buyerEmail: b[0]?.email || "" };
      } catch { return { id:o.id, status:o.status, totalAmount:o.totalAmount, currency:o.currency, createdAt:o.createdAt, buyerEmail:"" }; }
    }));
  } catch {}

  try {
    const convs = await db.orm.public.Conversation.select("id").all() as unknown as Array<{ id:number }>;
    stats.conversations = convs.length;
  } catch {}

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#fbfbf5]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-black">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600">Welcome, {user.name || user.email} · Monitor marketplace activity. Solid colors only, no payments.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Card><p className="text-sm text-zinc-600">Users</p><p className="mt-1 text-2xl font-semibold text-black">{stats.users}</p><p className="text-xs text-zinc-500">{stats.farmers} farmers · {stats.buyers} buyers · {stats.admins} admins</p></Card>
          <Card><p className="text-sm text-zinc-600">Products</p><p className="mt-1 text-2xl font-semibold text-black">{stats.products}</p><p className="text-xs text-zinc-500">{stats.active} active · {stats.hidden} hidden · {stats.soldOut} sold out</p></Card>
          <Card><p className="text-sm text-zinc-600">Orders</p><p className="mt-1 text-2xl font-semibold text-black">{stats.orders}</p><p className="text-xs text-zinc-500">{stats.submitted} submitted</p></Card>
          <Card><p className="text-sm text-zinc-600">Conversations</p><p className="mt-1 text-2xl font-semibold text-black">{stats.conversations}</p><p className="text-xs text-zinc-500">Buyer↔Farmer threads</p></Card>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-black">Recent Users</h2>
              <span className="text-xs text-zinc-500">{users.length} shown</span>
            </div>
            {users.length===0 ? <p className="mt-3 text-sm text-zinc-600">No users yet.</p> : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-zinc-500 border-b border-zinc-200"><th className="py-2">Email</th><th>Role</th><th>Name</th></tr></thead>
                  <tbody>
                    {users.map((u)=>(
                      <tr key={u.id} className="border-b border-zinc-100"><td className="py-2 text-black truncate max-w-[180px]">{u.email}</td><td><span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-black">{u.role}</span></td><td className="text-zinc-600">{u.name || "—"}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-3 text-xs text-zinc-500">Disable/remove users via direct DB moderation (no gradient badges).</p>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-black">Recent Orders</h2>
              <Link href="/farmer/orders" className="text-xs font-medium text-black hover:underline">View all</Link>
            </div>
            {orders.length===0 ? <p className="mt-3 text-sm text-zinc-600">No orders yet.</p> : (
              <div className="mt-3 space-y-2">
                {orders.map((o)=>(
                  <div key={o.id} className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2">
                    <div><p className="text-sm font-medium text-black">Order #{o.id} · {o.buyerEmail}</p><p className="text-xs text-zinc-500">{new Date(o.createdAt).toLocaleString()}</p></div>
                    <div className="text-right"><span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-black">{o.status}</span><p className="text-sm font-medium text-black">{o.totalAmount.toLocaleString()} {o.currency}</p></div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card className="mt-6">
          <h2 className="font-medium text-black">Products — moderation</h2>
          <p className="mt-1 text-sm text-zinc-600">Remove listings that violate policy. Farmers are notified implicitly via hidden status.</p>
          {products.length===0 ? <p className="mt-3 text-sm text-zinc-600">No products listed yet.</p> : (
            <div className="mt-4 space-y-2">
              {products.map((p)=>(
                <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border border-zinc-200 px-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-black truncate">{p.title} <span className="font-normal text-zinc-500">· {p.category}</span></p>
                    <p className="text-xs text-zinc-500">{p.price.toLocaleString()} MWK · {p.status} · Farmer: {p.farmerName || p.farmerId}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/products/${p.id}`} className="rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm font-medium text-black hover:bg-zinc-50">View</Link>
                    <AdminProductActions productId={p.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
