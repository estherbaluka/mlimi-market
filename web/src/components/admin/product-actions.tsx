"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminProductActions({ productId }: { productId:number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function remove() {
    if (!confirm("Remove this product? This will delete it for all buyers.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}`, { method:"DELETE" });
      const data = await res.json();
      if (!res.ok) alert(data.error || "Failed");
      else router.refresh();
    } catch { alert("Something went wrong"); }
    setLoading(false);
  }
  async function hide() {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}`, { method:"PATCH", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ status:"HIDDEN" })});
      const data = await res.json();
      if (!res.ok) alert(data.error || "Failed");
      else router.refresh();
    } catch { alert("Something went wrong"); }
    setLoading(false);
  }
  return (
    <>
      <button disabled={loading} onClick={hide} className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-text hover:bg-primary-soft disabled:opacity-50">Hide</button>
      <button disabled={loading} onClick={remove} className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">{loading ? "..." : "Remove"}</button>
    </>
  );
}
