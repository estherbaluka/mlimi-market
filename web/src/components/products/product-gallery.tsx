"use client";

import { useState } from "react";

type Props = {
  productId: number | string;
  title: string;
  images: Array<{ url: string; alt: string | null }>;
};

export function ProductGallery({ productId, title, images }: Props) {
  const list = images.length > 0 ? images : [{ url: `https://picsum.photos/seed/${productId}/800/600`, alt: title }];
  const [active, setActive] = useState(0);
  const current = list[Math.min(active, list.length - 1)];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={current.url} alt={current.alt || title} className="h-[420px] w-full object-cover" />
      {list.length > 1 && (
        <div className="grid grid-cols-4 gap-2 p-3" role="list" aria-label="Product images">
          {list.slice(0, 8).map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1} of ${list.length}`}
              aria-pressed={i === active}
              className={`overflow-hidden rounded-md border-2 ${i === active ? "border-primary" : "border-border hover:border-primary"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt || `${title} — image ${i + 1}`} className="h-20 w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
