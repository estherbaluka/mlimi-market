"use client";
import { useQuery } from "@tanstack/react-query";

type Conv = {
  id:number;
  buyerId:number; farmerId:number; productId:number|null;
  buyer:{ name:string|null; email:string }|null;
  farmer:{ name:string|null; email:string }|null;
  product:{ id:number; title:string }|null;
  lastMessage:{ body:string; createdAt:string }|null;
  unreadCount:number;
};

export function ConversationList({ selectedId, onSelect, role }: { selectedId:number|null; onSelect:(id:number)=>void; role:"BUYER"|"FARMER" }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await fetch("/api/conversations");
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<{ conversations: Conv[] }>;
    },
    refetchInterval: 5000,
  });

  if (isLoading) return <div className="p-4 text-sm text-zinc-600">Loading conversations...</div>;
  if (error) return <div className="p-4 text-sm text-red-600">Failed to load conversations.</div>;
  const list = data?.conversations || [];
  if (list.length===0) return <div className="p-8 text-center"><p className="font-medium text-black">No messages yet.</p><p className="text-sm text-zinc-600">Start a conversation from a product or order.</p></div>;

  return (
    <div className="divide-y divide-zinc-200">
      {list.map((c)=> {
        const other = role==="BUYER" ? c.farmer : c.buyer;
        return (
          <button key={c.id} onClick={()=>onSelect(c.id)} className={`w-full text-left p-4 hover:bg-zinc-50 ${selectedId===c.id ? "bg-zinc-100" : "bg-white"}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-black truncate">{other?.name || other?.email || "Unknown"}</p>
                <p className="text-xs text-zinc-500 truncate">{c.product ? `Re: ${c.product.title}` : "Direct conversation"}</p>
                <p className="mt-1 text-sm text-zinc-600 truncate">{c.lastMessage?.body || "No messages"}</p>
              </div>
              {c.unreadCount>0 && <span className="shrink-0 rounded-full bg-black px-2 py-0.5 text-xs font-medium text-white">{c.unreadCount}</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}
