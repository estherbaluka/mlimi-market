import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/logout-button";
import { MobileMenu } from "@/components/layout/mobile-menu";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-primary">
      <div className="relative mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 py-2">
        <Link href="/" className="flex min-h-[44px] items-center gap-2">
        <span ><Image src='/favicon.ico' alt="Logo" width={32} height={32}></Image></span> 
          <span className="text-lg font-semibold tracking-tight text-white">
            Mlimi Market
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden flex-wrap items-center gap-x-4 gap-y-2 md:flex">
          <Link href="/products" className="inline-flex min-h-[44px] items-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover">Products</Link>
          {user ? (
            <>              
              {user.role === "BUYER" && (
                <>
                  <Link href="/buyer/cart" className="inline-flex min-h-[44px] items-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover">Cart</Link>
                  <Link href="/buyer/orders" className="inline-flex min-h-[44px] items-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover">Orders</Link>
                  <Link href="/buyer/messages" className="inline-flex min-h-[44px] items-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover">Messages</Link>
                  <Link href="/buyer/dashboard" className="inline-flex min-h-[44px] items-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover">Dashboard</Link>
                </>
              )}
              {user.role === "FARMER" && (
                <>
                  <Link href="/farmer/products" className="inline-flex min-h-[44px] items-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover">Products</Link>
                  <Link href="/farmer/orders" className="inline-flex min-h-[44px] items-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover">Orders</Link>
                  <Link href="/farmer/messages" className="inline-flex min-h-[44px] items-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover">Messages</Link>
                  <Link href="/farmer/dashboard" className="inline-flex min-h-[44px] items-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover">Dashboard</Link>
                </>
              )}
              {user.role === "ADMIN" && (
                <Link href="/admin/dashboard" className="inline-flex min-h-[44px] items-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover">Dashboard</Link>
              )}
              <span className="hidden sm:inline text-sm text-muted bg-primary-soft px-2">
                {user.name || user.email}
              </span>
              <LogoutButton variant="outline" className="min-h-[44px] px-4 text-sm" />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex min-h-[44px] items-center rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-text hover:bg-primary-soft"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-[44px] items-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover"
              >
                Create account
              </Link>
            </>
          )}
        </nav>
        <MobileMenu user={user ? { role: user.role, name: user.name, email: user.email } : null} />
      </div>
    </header>
  );
}
