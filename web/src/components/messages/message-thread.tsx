"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type Message = { id:number; senderId:number; body:string; createdAt:string; isRead:boolean };
type Props = { conversationId:number; currentUserId:number };

export function MessageThread({ conversationId, currentUserId }: Props) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string|null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ messages: Message[] }>;
    },
    refetchInterval: 5000,
  });

  const send = useMutation({
    mutationFn: async (text:string) => {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ body: text })});
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Send failed");
      return json;
    },
    onSuccess: () => { setBody(""); setError(null); qc.invalidateQueries({ queryKey: ["messages", conversationId]}); qc.invalidateQueries({ queryKey: ["conversations"]}); },
    onError: (e: Error) => setError(e.message),
  });

  if (isLoading) return <div className="p-4 text-sm text-muted">Loading messages...</div>;
  const messages = data?.messages || [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length===0 ? <p className="text-sm text-muted text-center py-8">No messages yet. Say hello!</p> : messages.map((m)=>(
          <div key={m.id} className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${m.senderId===currentUserId ? "ml-auto bg-primary text-white" : "bg-primary-soft text-text"}`}>
            <p>{m.body}</p>
            <p className={`mt-1 text-xs ${m.senderId===currentUserId ? "text-white/70" : "text-muted"}`}>{new Date(m.createdAt).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit"})}</p>
          </div>
        ))}
      </div>
      <form onSubmit={(e)=>{ e.preventDefault(); if (!body.trim()) { setError("Message cannot be empty"); return; } send.mutate(body); }} className="border-t border-border bg-card p-3">
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <input value={body} onChange={(e)=>setBody(e.target.value)} placeholder="Type a message..." className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-base text-text focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]" />
          <button type="submit" disabled={send.isPending} className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50 min-h-[44px]">{send.isPending ? "..." : "Send"}</button>
        </div>
      </form>
    </div>
  );
}
