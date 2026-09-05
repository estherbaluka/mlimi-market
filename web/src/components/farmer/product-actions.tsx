"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function FarmerProductActions({ product }: { product: { id:number; status:string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function patch(payload: Record<string, unknown>, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setLoading(JSON.stringify(payload));
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "PATCH", headers:{ "Content-Type":"application/json"}, body: JSON.stringify(payload)});
      const data = await res.json();
      if (!res.ok) alert(data.error || "Action failed");
      else router.refresh();
    } catch { alert("Something went wrong"); }
    setLoading(null);
  }

  async function del() {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setLoading("delete");
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE"});
      const data = await res.json();
      if (!res.ok) alert(data.error || "Delete failed");
      else router.refresh();
    } catch { alert("Something went wrong"); }
    setLoading(null);
  }

  return (
    <>
      {product.status === "ACTIVE" ? (
        <button disabled={!!loading} onClick={()=>patch({ status:"HIDDEN"})} className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-text hover:bg-primary-soft disabled:opacity-50">Hide</button>
      ) : product.status === "HIDDEN" ? (
        <button disabled={!!loading} onClick={()=>patch({ status:"ACTIVE"})} className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">Show</button>
      ) : null}
      {product.status !== "SOLD_OUT" ? (
        <button disabled={!!loading} onClick={()=>patch({ status:"SOLD_OUT" }, "Mark as sold out?")} className="rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50">Sold out</button>
      ) : (
        <button disabled={!!loading} onClick={()=>patch({ status:"ACTIVE"})} className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-text hover:bg-primary-soft disabled:opacity-50">Restock</button>
      )}
      <button disabled={!!loading} onClick={del} className="rounded-full border border-red-200 bg-card px-4 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">Delete</button>
    </>
  );
}
