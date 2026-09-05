import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { db } from "@/prisma/db";

type FarmerOrder = {
  id: number;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  buyerName: string | null;
};

export default async function FarmerDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "FARMER") redirect(`/${user.role.toLowerCase()}/dashboard`);

  let totalProducts = 0;
  let activeProducts = 0;
  let soldOutProducts = 0;
  let recentProducts: Array<{ id: number; title: string; status: string; stockQuantity: number }> = [];
  try {
    const rows = (await db.orm.public.Product.where({ farmerId: user.id })
      .select("id", "title", "status", "stockQuantity", "createdAt")
      .all()) as unknown as Array<{ id: number; title: string; status: string; stockQuantity: number; createdAt: string }>;
    totalProducts = rows.length;
    activeProducts = rows.filter((p) => p.status === "ACTIVE").length;
    soldOutProducts = rows.filter((p) => p.status === "SOLD_OUT").length;
    recentProducts = rows
      .sort((a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime())
      .slice(0, 3);
  } catch {}

  let newRequests = 0;
  let recentOrders: FarmerOrder[] = [];
  try {
    const allOrders = (await db.orm.public.Order.select("id", "buyerId", "status", "totalAmount", "currency", "createdAt").all()) as unknown as Array<{
      id: number; buyerId: number; status: string; totalAmount: number; currency: string; createdAt: string;
    }>;
    const mine: typeof allOrders = [];
    for (const o of allOrders) {
      try {
        const items = (await db.orm.public.OrderItem.where({ orderId: o.id })
          .select("productId")
          .all()) as unknown as Array<{ productId: number }>;
        let has = false;
        for (const it of items) {
          const prods = (await db.orm.public.Product.where({ id: it.productId })
            .select("farmerId")
            .all()) as unknown as Array<{ farmerId: number }>;
          if (prods[0]?.farmerId === user.id) {
            has = true;
            break;
          }
        }
        if (has) mine.push(o);
      } catch {}
    }
    newRequests = mine.filter((o) => o.status === "SUBMITTED").length;
    const sorted = mine.sort(
      (a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime()
    );
    recentOrders = await Promise.all(
      sorted.slice(0, 3).map(async (o) => {
        try {
          const buyers = (await db.orm.public.User.where({ id: o.buyerId })
            .select("name")
            .all()) as unknown as Array<{ name: string | null }>;
          return { ...o, buyerName: buyers[0]?.name || null };
        } catch {
          return { ...o, buyerName: null };
        }
      })
    );
  } catch {}

  let unreadCount = 0;
  let conversationCount = 0;
  try {
    const convs = (await db.orm.public.Conversation.where({ farmerId: user.id })
      .select("id")
      .all()) as unknown as Array<{ id: number }>;
    conversationCount = convs.length;
    const counts = await Promise.all(
      convs.map(async (c) => {
        try {
          const msgs = (await db.orm.public.Message.where({ conversationId: c.id })
            .select("senderId", "isRead")
            .all()) as unknown as Array<{ senderId: number; isRead: boolean }>;
          return msgs.filter((m) => m.senderId !== user.id && !m.isRead).length;
        } catch {
          return 0;
        }
      })
    );
    unreadCount = counts.reduce((sum, n) => sum + n, 0);
  } catch {}

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-page">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold text-text">Farmer Dashboard</h1>
        <p className="mt-2 text-muted">Welcome back, <strong>{user.name || user.email}</strong>.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-text">Products</h2>
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-text">
                {totalProducts} total
              </span>
            </div>
            {totalProducts === 0 ? (
              <p className="mt-2 text-sm text-muted">No products listed yet.</p>
            ) : (
              <div className="mt-2 text-sm text-muted">
                <p>{activeProducts} active · {soldOutProducts} sold out</p>
                <ul className="mt-2 space-y-1">
                  {recentProducts.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2">
                      <span className="truncate text-text">{p.title}</span>
                      <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-text">
                        {p.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Link href="/farmer/products" className="mt-3 inline-flex text-sm font-medium text-text hover:underline">
              Manage products →
            </Link>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-text">Orders</h2>
              {newRequests > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white">
                  {newRequests} new
                </span>
              )}
            </div>
            {recentOrders.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No new order requests.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {recentOrders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-2">
                    <span className="text-text">
                      Order #{o.id} · {o.buyerName || "Buyer"}
                    </span>
                    <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-text">
                      {o.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/farmer/orders" className="mt-3 inline-flex text-sm font-medium text-text hover:underline">
              View order requests →
            </Link>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-text">Messages</h2>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-muted">
              {conversationCount === 0
                ? "No messages yet."
                : `${conversationCount} conversation(s)${unreadCount > 0 ? ` · ${unreadCount} unread` : ""}`}
            </p>
            <Link href="/farmer/messages" className="mt-3 inline-flex text-sm font-medium text-text hover:underline">
              Open messages →
            </Link>
          </Card>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-text">Quick actions</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/farmer/products/new" className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover">
              Add Product
            </Link>
            <Link href="/farmer/products" className="rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-text hover:bg-primary-soft">
              My Products
            </Link>
            <Link href="/farmer/orders" className="rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-text hover:bg-primary-soft">
              Order Requests
            </Link>
            <Link href="/farmer/messages" className="rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-text hover:bg-primary-soft">
              Messages
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
