// @ts-nocheck
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { BuyerMessagesClient } from "@/components/messages/buyer-messages-client";

export default async function BuyerMessagesPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "BUYER") redirect(`/${user.role.toLowerCase()}/dashboard`);
  const params = await searchParams;
  const initialId = params.c ? Number(params.c) : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-page">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-semibold text-text">Messages</h1>
        <p className="text-sm text-muted">Chat with farmers — polling every 5s.</p>
        <Card className="mt-6 p-0 overflow-hidden">
          <BuyerMessagesClient currentUserId={user.id} initialConversationId={Number.isNaN(initialId) ? null : initialId} role="BUYER" />
        </Card>
      </div>
    </div>
  );
}
