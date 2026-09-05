import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { DashboardCartSummary } from "@/components/buyer/dashboard-cart-summary";
import { db } from "@/prisma/db";

type BuyerOrder = {
  id: number;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  itemCount: number;
};

type RecommendedProduct = {
  id: number;
  title: string;
  category: string;
  price: number;
  currency: string;
  unit: string;
  stockQuantity: number;
  imageUrl: string | null;
};

export default async function BuyerDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "BUYER") redirect(`/${user.role.toLowerCase()}/dashboard`);

  let orders: BuyerOrder[] = [];
  let orderCount = 0;
  try {
    const rows = (await db.orm.public.Order.where({ buyerId: user.id })
      .select("id", "status", "totalAmount", "currency", "createdAt")
      .all()) as unknown as Array<Omit<BuyerOrder, "itemCount">>;
    const sorted = rows.sort(
      (a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime()
    );
    orderCount = sorted.length;
    const recent = sorted.slice(0, 3);
    orders = await Promise.all(
      recent.map(async (o) => {
        try {
          const items = (await db.orm.public.OrderItem.where({ orderId: o.id })
            .select("id")
            .all()) as unknown as Array<{ id: number }>;
          return { ...o, itemCount: items.length };
        } catch {
          return { ...o, itemCount: 0 };
        }
      })
    );
  } catch {}

  let recommended: RecommendedProduct[] = [];
  try {
    const rows = (await db.orm.public.Product.where({ status: "ACTIVE" })
      .select("id", "title", "category", "price", "currency", "unit", "stockQuantity", "createdAt")
      .all()) as unknown as Array<Omit<RecommendedProduct, "imageUrl"> & { createdAt: string }>;
    const sorted = rows
      .filter((p) => p.stockQuantity > 0)
      .sort((a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime())
      .slice(0, 4);
    recommended = await Promise.all(
      sorted.map(async (p) => {
        try {
          const imgs = (await db.orm.public.ProductImage.where({ productId: p.id })
            .select("url")
            .all()) as unknown as Array<{ url: string }>;
          return { ...p, imageUrl: imgs[0]?.url || null };
        } catch {
          return { ...p, imageUrl: null };
        }
      })
    );
  } catch {}

  let unreadCount = 0;
  let conversationCount = 0;
  try {
    const convs = (await db.orm.public.Conversation.where({ buyerId: user.id })
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
        <h1 className="text-2xl font-semibold text-text">Buyer Dashboard</h1>
        <p className="mt-2 text-muted">Welcome back, {user.name || user.email}.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-text">Recent Orders</h2>
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-text">
                {orderCount}
              </span>
            </div>
            {orders.length === 0 ? (
              <p className="mt-2 text-sm text-muted">You have no orders yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {orders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-2">
                    <span className="text-text">
                      Order #{o.id} · {o.itemCount} item(s)
                    </span>
                    <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-text">
                      {o.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/buyer/orders" className="mt-3 inline-flex text-sm font-medium text-text hover:underline">
              View orders →
            </Link>
          </Card>
          <Card>
            <h2 className="font-medium text-text">Cart</h2>
            <DashboardCartSummary />
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
            <Link href="/buyer/messages" className="mt-3 inline-flex text-sm font-medium text-text hover:underline">
              Open messages →
            </Link>
          </Card>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">Recommended products</h2>
            <Link href="/products" className="text-sm font-medium text-text hover:underline">
              Browse all →
            </Link>
          </div>
          {recommended.length === 0 ? (
            <Card className="mt-4 text-center">
              <p className="font-medium text-text">No products found.</p>
              <p className="mt-1 text-sm text-muted">Check back soon for fresh produce.</p>
            </Card>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recommended.map((p) => (
                <Card key={p.id} className="p-0 overflow-hidden">
                  <div className="aspect-[4/3] bg-primary-soft">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.imageUrl || `https://picsum.photos/seed/${p.id}/400/300`}
                      alt={p.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-text">{p.title}</p>
                    <p className="mt-1 text-sm text-muted">
                      {p.price.toLocaleString()} {p.currency}/{p.unit}
                    </p>
                    <Link href={`/products/${p.id}`} className="mt-2 inline-flex text-sm font-medium text-text hover:underline">
                      View →
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-text">Quick links</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/products" className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover">
              Browse Products
            </Link>
            <Link href="/buyer/cart" className="rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-text hover:bg-primary-soft">
              Cart
            </Link>
            <Link href="/buyer/checkout" className="rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-text hover:bg-primary-soft">
              Checkout
            </Link>
            <Link href="/buyer/orders" className="rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-text hover:bg-primary-soft">
              Orders
            </Link>
            <Link href="/buyer/messages" className="rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-text hover:bg-primary-soft">
              Messages
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
