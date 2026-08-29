"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function StartConversationButton({ farmerId, productId, label="Message farmer" }: { farmerId:number; productId?:number; label?:string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function start() {
    setLoading(true);
    try {
      const res = await fetch("/api/conversations", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ farmerId, productId })});
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed"); return; }
      // redirect to messages with conversation selected via query param
      router.push(`/buyer/messages?c=${data.conversationId}`);
    } catch { alert("Something went wrong"); }
    setLoading(false);
  }
  return <button onClick={start} disabled={loading} className="rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-zinc-50 disabled:opacity-50">{loading ? "..." : label}</button>;
}
