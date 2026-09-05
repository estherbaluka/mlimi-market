"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const transitions: Record<string, Array<{ label:string; status:string; variant:"primary"|"outline"|"danger"}>> = {
  SUBMITTED: [{ label:"Accept Order", status:"ACCEPTED", variant:"primary" }, { label:"Reject Order", status:"REJECTED", variant:"danger" }],
  ACCEPTED: [{ label:"Mark as Preparing", status:"PREPARING", variant:"primary" }],
  PREPARING: [{ label:"Ready for Pickup", status:"READY_FOR_PICKUP", variant:"primary" }, { label:"Out for Delivery", status:"OUT_FOR_DELIVERY", variant:"primary" }],
  READY_FOR_PICKUP: [{ label:"Out for Delivery", status:"OUT_FOR_DELIVERY", variant:"primary" }, { label:"Mark as Delivered", status:"DELIVERED", variant:"primary" }],
  OUT_FOR_DELIVERY: [{ label:"Mark as Delivered", status:"DELIVERED", variant:"primary" }],
};

export function FarmerOrderActions({ orderId, currentStatus }: { orderId:number; currentStatus:string; deliveryMethod:string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string|null>(null);
  const [error, setError] = useState<string|null>(null);
  const actions = transitions[currentStatus] || [];

  async function update(status:string, confirmMsg?:string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setLoading(status); setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method:"PATCH", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ status })});
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to update order");
      else router.refresh();
    } catch { setError("Something went wrong"); }
    setLoading(null);
  }

  if (actions.length===0) return <p className="text-sm text-muted">No further actions. Status is terminal: {currentStatus}</p>;

  return (
    <div className="space-y-3">
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="flex flex-wrap gap-2">
        {actions.map((a)=>(
          <button key={a.status} disabled={!!loading} onClick={()=>update(a.status, a.status==="REJECTED" ? "Reject this order?" : undefined)} className={`rounded-full px-5 py-2 text-sm font-medium ${a.variant==="primary" ? "bg-primary text-white hover:bg-primary-hover disabled:opacity-50" : a.variant==="danger" ? "border border-red-200 bg-card text-red-600 hover:bg-red-50" : "border border-border bg-card text-text hover:bg-primary-soft"} disabled:opacity-50`}>
            {loading===a.status ? "Updating..." : a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
