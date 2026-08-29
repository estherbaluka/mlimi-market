import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";

export default async function BuyerDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "BUYER") redirect(`/${user.role.toLowerCase()}/dashboard`);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#fbfbf5]">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold text-black">Buyer Dashboard</h1>
        <p className="mt-2 text-zinc-600">Welcome back, {user.name || user.email}.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Card>
            <h2 className="font-medium text-black">Recent Orders</h2>
            <p className="mt-2 text-sm text-zinc-600">You have no orders yet.</p>
          </Card>
          <Card>
            <h2 className="font-medium text-black">Cart</h2>
            <p className="mt-2 text-sm text-zinc-600">Your cart is empty.</p>
          </Card>
          <Card>
            <h2 className="font-medium text-black">Messages</h2>
            <p className="mt-2 text-sm text-zinc-600">No messages yet.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
