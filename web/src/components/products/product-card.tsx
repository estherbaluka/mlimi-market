import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  product: {
    id: number | string;
    title: string;
    category: string;
    price: number;
    currency: string;
    unit: string;
    stockQuantity: number;
    status: string;
    images?: Array<{ url: string }>;
    farmer?: { name?: string | null; farmName?: string; location?: string } | null;
  };
  onAddToCart?: () => void;
};

export function ProductCard({ product, onAddToCart }: Props) {
  const img = product.images?.[0]?.url || `https://picsum.photos/seed/${product.id}/400/300`;
  const soldOut = product.status === "SOLD_OUT" || product.stockQuantity <= 0;
  const hidden = product.status === "HIDDEN";
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <Link href={`/products/${product.id}`} className="block min-h-0">
        <div className="aspect-[4/3] overflow-hidden bg-primary-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={product.title} className="h-full w-full object-cover" />
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/products/${product.id}`} className="inline-link font-medium text-text hover:text-primary hover:underline line-clamp-2">
            {product.title}
          </Link>
          <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">{product.category}</span>
        </div>
        <p className="mt-1 text-sm text-muted">
          {product.farmer?.farmName || product.farmer?.name || "Unknown farm"} {product.farmer?.location ? `· ${product.farmer.location}` : ""}
        </p>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-lg font-semibold text-text">{product.price.toLocaleString()}</span>
          <span className="text-sm text-muted">{product.currency}/{product.unit}</span>
        </div>
        <p className="mt-1 text-xs text-muted">
          {soldOut ? <span className="text-accent-hover font-medium">Sold out</span> : `${product.stockQuantity} ${product.unit} available`}
          {hidden ? " · Hidden" : ""}
        </p>
        <div className="mt-4 flex gap-2">
          <Button disabled={soldOut || hidden} onClick={onAddToCart} className="flex-1">
            Add to cart
          </Button>
          <Link href={`/products/${product.id}`} className="rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-text hover:bg-primary-soft inline-flex min-h-[44px] items-center justify-center">
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
