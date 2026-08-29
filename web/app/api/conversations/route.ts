// @ts-nocheck
import { NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const createSchema = z.object({
  farmerId: z.coerce.number().int().positive(),
  productId: z.coerce.number().int().positive().optional().nullable(),
  initialMessage: z.string().trim().min(1, "Message cannot be empty").max(2000).optional(),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    let conversations: Array<Record<string, unknown>> = [];
    if (session.role === "BUYER") {
      const rows = await db.orm.public.Conversation.where({ buyerId: session.userId }).select("id","buyerId","farmerId","productId","createdAt","updatedAt").all() as unknown as typeof conversations;
      conversations = rows;
    } else if (session.role === "FARMER") {
      const rows = await db.orm.public.Conversation.where({ farmerId: session.userId }).select("id","buyerId","farmerId","productId","createdAt","updatedAt").all() as unknown as typeof conversations;
      conversations = rows;
    } else {
      // ADMIN sees all? For MVP return empty
      conversations = [];
    }

    const enriched = await Promise.all(conversations.map(async (c) => {
      const buyerRows = await db.orm.public.User.where({ id: c.buyerId as number }).select("id","name","email").all() as unknown as Array<{ id:number; name:string|null; email:string }>;
      const farmerRows = await db.orm.public.User.where({ id: c.farmerId as number }).select("id","name","email").all() as unknown as Array<{ id:number; name:string|null; email:string }>;
      let product: Record<string,unknown>|null = null;
      if (c.productId) {
        try {
          const prods = await db.orm.public.Product.where({ id: c.productId as number }).select("id","title","price","currency","unit").all() as unknown as Array<Record<string,unknown>>;
          product = prods[0] || null;
        } catch {}
      }
      // last message preview + unread count
      let lastMessage: Record<string,unknown>|null = null;
      let unreadCount = 0;
      try {
        const msgs = await db.orm.public.Message.where({ conversationId: c.id as number }).select("id","body","senderId","isRead","createdAt").all() as unknown as Array<Record<string,unknown>>;
        msgs.sort((a,b)=> new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime());
        lastMessage = msgs[0] || null;
        unreadCount = msgs.filter((m)=> m.senderId !== session.userId && !m.isRead).length;
      } catch {}
      return { ...c, buyer: buyerRows[0]||null, farmer: farmerRows[0]||null, product, lastMessage, unreadCount };
    }));

    enriched.sort((a,b)=> new Date(String(b.updatedAt)).getTime() - new Date(String(a.updatedAt)).getTime());
    return NextResponse.json({ conversations: enriched });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Something went wrong." }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });

    let farmerId = parsed.data.farmerId;
    let productId = parsed.data.productId || null;
    let buyerId: number;

    if (session.role === "BUYER") {
      buyerId = session.userId;
      // verify farmer exists and is FARMER
      const farmers = await db.orm.public.User.where({ id: farmerId }).select("id","role").all() as unknown as Array<{ id:number; role:string }>;
      if (!farmers[0] || farmers[0].role !== "FARMER") return NextResponse.json({ error: "Farmer not found" }, { status: 404 });
      if (productId) {
        const prods = await db.orm.public.Product.where({ id: productId }).select("id","farmerId").all() as unknown as Array<{ id:number; farmerId:number }>;
        if (prods[0] && prods[0].farmerId !== farmerId) return NextResponse.json({ error: "Product does not belong to farmer" }, { status: 400 });
      }
    } else if (session.role === "FARMER") {
      // Farmer initiating to buyer
      buyerId = farmerId; // here farmerId field actually carries buyerId when farmer initiates
      farmerId = session.userId;
      const buyers = await db.orm.public.User.where({ id: buyerId }).select("id","role").all() as unknown as Array<{ id:number; role:string }>;
      if (!buyers[0] || buyers[0].role !== "BUYER") return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    } else {
      return NextResponse.json({ error: "Admin cannot start conversations" }, { status: 403 });
    }

    if (buyerId === farmerId) return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });

    // Try to find existing conversation
    let existing: Record<string,unknown>|null = null;
    try {
      const rows = await db.orm.public.Conversation.where({ buyerId, farmerId, productId }).select("id","buyerId","farmerId","productId").all() as unknown as Array<Record<string,unknown>>;
      // Prisma where with nullable productId may not match null correctly, so fallback manual filter
      if (rows.length>0) existing = rows[0];
      else {
        // fallback: fetch buyer farmer pair and filter productId
        const all = await db.orm.public.Conversation.where({ buyerId }).select("id","buyerId","farmerId","productId").all() as unknown as Array<Record<string,unknown>>;
        existing = all.find((c)=> c.farmerId===farmerId && (c.productId||null)===(productId||null)) || null;
      }
    } catch {}

    let conversationId: number;
    if (existing) {
      conversationId = existing.id as number;
    } else {
      const created = await db.orm.public.Conversation.create({ buyerId, farmerId, productId }) as unknown as { id:number };
      conversationId = created.id;
    }

    if (parsed.data.initialMessage) {
      await db.orm.public.Message.create({ conversationId, senderId: session.userId, body: parsed.data.initialMessage, isRead: false });
      // bump conversation updatedAt - rely on temporal.updatedAtString trigger? manually update via where update
      try { await db.orm.public.Conversation.where({ id: conversationId }).update({ updatedAt: new Date().toISOString() } as never); } catch {}
    }

    return NextResponse.json({ message: "Conversation ready", conversationId }, { status: 201 });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Something went wrong." }, { status: 500 }); }
}
