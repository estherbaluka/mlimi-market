"use client";
import { useState } from "react";
import { ConversationList } from "./conversation-list";
import { MessageThread } from "./message-thread";

export function BuyerMessagesClient({ currentUserId, initialConversationId, role }: { currentUserId:number; initialConversationId:number|null; role:"BUYER"|"FARMER" }) {
  const [selected, setSelected] = useState<number|null>(initialConversationId);
  return (
    <div className="grid md:grid-cols-[360px_1fr] h-[560px]">
      <div className="border-r border-border overflow-y-auto bg-card">
        <ConversationList selectedId={selected} onSelect={setSelected} role={role} />
      </div>
      <div className="flex flex-col bg-page">
        {selected ? <MessageThread conversationId={selected} currentUserId={currentUserId} /> : <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted">Select a conversation</div>}
      </div>
    </div>
  );
}
