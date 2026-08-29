// @ts-nocheck
import { NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const messageSchema = z.object({ body: z.string().trim().min(1, "Message cannot be empty").max(2000) });

async function getConversationOr403(conversationId:number, session:{ userId:number; role:string }) {
  const rows = await db.orm.public.Conversation.where({ id: conversationId }).select("id","buyerId","farmerId").all() as unknown as Array<{ id:number; buyerId:number; farmerId:number }>;
  const conv = rows[0];
  if (!conv) return { error: NextResponse.json({ error: "Conversation not found" }, { status: 404 }) };
  if (conv.buyerId !== session.userId && conv.farmerId !== session.userId && session.role !== "ADMIN") return { error: NextResponse.json({ error: "Not part of this conversation" }, { status: 403 }) };
  return { conv };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id:string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const { id } = await params;
    const conversationId = Number(id);
    if (Number.isNaN(conversationId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const { conv, error } = await getConversationOr403(conversationId, session);
    if (error) return error;

    const messages = await db.orm.public.Message.where({ conversationId }).select("id","conversationId","senderId","body","isRead","createdAt").all() as unknown as Array<Record<string,unknown>>;
    messages.sort((a,b)=> new Date(String(a.createdAt)).getTime() - new Date(String(b.createdAt)).getTime());

    // Mark others' messages as read
    for (const m of messages) {
      if (m.senderId !== session.userId && !m.isRead) {
        try { await db.orm.public.Message.where({ id: m.id as number }).update({ isRead: true } as never); m.isRead = true; } catch {}
      }
    }

    return NextResponse.json({ messages, conversation: conv });
  } catch (e){ console.error(e); return NextResponse.json({ error: "Something went wrong." }, { status: 500 }); }
}

export async function POST(request: Request, { params }: { params: Promise<{ id:string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const { id } = await params;
    const conversationId = Number(id);
    if (Number.isNaN(conversationId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const { conv, error } = await getConversationOr403(conversationId, session);
    if (error) return error;

    const body = await request.json();
    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });

    const created = await db.orm.public.Message.create({ conversationId, senderId: session.userId, body: parsed.data.body, isRead: false }) as unknown as { id:number };
    try { await db.orm.public.Conversation.where({ id: conversationId }).update({ updatedAt: new Date().toISOString() } as never); } catch {}

    const rows = await db.orm.public.Message.where({ id: created.id }).select("id","conversationId","senderId","body","isRead","createdAt").all() as unknown as Array<Record<string,unknown>>;
    return NextResponse.json({ message: "Message sent successfully.", data: rows[0] }, { status: 201 });
  } catch (e){ console.error(e); return NextResponse.json({ error: "Something went wrong." }, { status: 500 }); }
}
