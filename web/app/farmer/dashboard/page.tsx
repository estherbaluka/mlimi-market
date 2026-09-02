import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";

export default async function FarmerDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "FARMER") redirect(`/${user.role.toLowerCase()}/dashboard`);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#fbfbf5]">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold text-black">Farmer Dashboard</h1>
        <p className="mt-2 text-zinc-600">Welcome back, <strong>{user.name || user.email}</strong>.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Card>
            <h2 className="font-medium text-black">Products</h2>
            <p className="mt-2 text-sm text-zinc-600">No products listed yet.</p>
          </Card>
          <Card>
            <h2 className="font-medium text-black">Orders</h2>
            <p className="mt-2 text-sm text-zinc-600">No new order requests.</p>
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
