import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/logout-button";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight text-black">
            Mlimi Market
          </span>
          <span className="hidden sm:inline text-xs font-medium text-zinc-500 rounded-full bg-zinc-100 px-2 py-0.5">
            Farm Marketplace
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link href="/products" className="text-sm font-medium text-black hover:underline">Products</Link>
          {user ? (
            <>
              <span className="hidden sm:inline text-sm text-zinc-600">
                {user.name || user.email}
              </span>
              <span className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
                {user.role}
              </span>
              {user.role === "BUYER" && (
                <>
                  <Link href="/buyer/cart" className="text-sm font-medium text-black hover:underline">Cart</Link>
                  <Link href="/buyer/orders" className="text-sm font-medium text-black hover:underline">Orders</Link>
                  <Link href="/buyer/messages" className="text-sm font-medium text-black hover:underline">Messages</Link>
                  <Link href="/buyer/dashboard" className="text-sm font-medium text-black hover:underline">Dashboard</Link>
                </>
              )}
              {user.role === "FARMER" && (
                <>
                  <Link href="/farmer/products" className="text-sm font-medium text-black hover:underline">Products</Link>
                  <Link href="/farmer/orders" className="text-sm font-medium text-black hover:underline">Orders</Link>
                  <Link href="/farmer/messages" className="text-sm font-medium text-black hover:underline">Messages</Link>
                  <Link href="/farmer/dashboard" className="text-sm font-medium text-black hover:underline">Dashboard</Link>
                </>
              )}
              {user.role === "ADMIN" && (
                <Link href="/admin/dashboard" className="text-sm font-medium text-black hover:underline">Dashboard</Link>
              )}
              <LogoutButton variant="outline" className="h-8 px-3 text-sm" />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-zinc-200 bg-white px-5 py-2 text-sm font-medium text-black hover:bg-zinc-50"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
