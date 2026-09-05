"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelOrderButton({ orderId }: { orderId:number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  async function cancel() {
    if (!confirm("Cancel this order?")) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method:"PATCH", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ status:"CANCELLED"})});
      const data = await res.json();
      if (!res.ok) setError(data.error || "Cancel failed");
      else router.refresh();
    } catch { setError("Something went wrong"); }
    setLoading(false);
  }
  return (
    <div className="space-y-2">
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <button disabled={loading} onClick={cancel} className="rounded-full border border-red-200 bg-card px-6 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">{loading ? "Cancelling..." : "Cancel Order"}</button>
      <p className="text-xs text-muted">You can cancel while order is SUBMITTED or ACCEPTED.</p>
    </div>
  );
}
