import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero - solid colors only, no gradients */}
      <section className="bg-[#fbfbf5] border-b border-zinc-200">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-black px-3 py-1 text-xs font-medium text-white">Farm Marketplace</span>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-black md:text-5xl">Fresh produce, direct from farmers.</h1>
            <p className="mt-4 text-base leading-6 text-zinc-600">Mlimi Market connects farmers who list agricultural produce with buyers who want to purchase directly — no middlemen, no online payments, just simple order requests.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/products" className="rounded-full bg-black px-8 py-3 text-center text-sm font-medium text-white hover:bg-zinc-800">Browse Products</Link>
              <Link href="/register" className="rounded-full border border-zinc-200 bg-white px-8 py-3 text-center text-sm font-medium text-black hover:bg-zinc-50">Create account</Link>
            </div>
            <p className="mt-3 text-xs text-zinc-500">Orders use “Place Order” — no payment processing.</p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 p-6">
              <h3 className="font-medium text-black">For Buyers</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">Browse, search, filter by category, price and unit. Add to cart, choose pickup or delivery, and place your order without payment.</p>
              <Link href="/buyer/dashboard" className="mt-4 inline-flex text-sm font-medium text-black hover:underline">Buyer dashboard →</Link>
            </div>
            <div className="rounded-xl border border-zinc-200 p-6">
              <h3 className="font-medium text-black">For Farmers</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">Register as a farmer, add products, manage stock and status, and handle incoming order requests.</p>
              <Link href="/farmer/dashboard" className="mt-4 inline-flex text-sm font-medium text-black hover:underline">Farmer dashboard →</Link>
            </div>
            <div className="rounded-xl border border-zinc-200 p-6">
              <h3 className="font-medium text-black">How it works</h3>
              <ol className="mt-2 list-decimal pl-4 text-sm leading-6 text-zinc-600">
                <li>Farmer lists produce</li>
                <li>Buyer adds to cart and places order (status: SUBMITTED)</li>
                <li>Farmer accepts, prepares, and marks ready/delivered</li>
              </ol>
            </div>
          </div>

          <div className="mt-12 rounded-xl border border-zinc-200 bg-[#fbfbf5] p-8">
            <h2 className="text-xl font-semibold text-black">Categories</h2>
            <p className="mt-1 text-sm text-zinc-600">Vegetables · Fruits · Grains · Tubers · Legumes · Dairy · Poultry · Honey · Herbs</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Vegetables","Fruits","Grains","Tubers","Legumes","Dairy","Poultry","Honey","Herbs"].map((c) => (
                <Link key={c} href={`/products?category=${c}`} className="rounded-full bg-white border border-zinc-200 px-4 py-1.5 text-sm font-medium text-black hover:bg-zinc-50">{c}</Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
