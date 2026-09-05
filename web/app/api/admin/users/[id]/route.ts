// @ts-nocheck
import { NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { getSession } from "@/lib/auth";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "You are not allowed to perform this action." }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Only admins can remove users." }, { status: 403 });

    const { id } = await params;
    const userId = Number(id);
    if (Number.isNaN(userId)) return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
    if (userId === session.userId) return NextResponse.json({ error: "You cannot remove your own admin account." }, { status: 400 });

    const existing = await db.orm.public.User.where({ id: userId }).select("id", "role", "email").all();
    const target = existing[0] as unknown as { id: number; role: string; email: string } | undefined;
    if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
    if (target.role === "ADMIN") return NextResponse.json({ error: "Admin accounts cannot be removed." }, { status: 403 });

    try {
      await db.orm.public.User.where({ id: userId }).delete();
    } catch (e) {
      console.error("DELETE /api/admin/users error:", e);
      return NextResponse.json({ error: "Cannot remove user with existing order history. Remove their products first." }, { status: 400 });
    }

    return NextResponse.json({ message: `User ${target.email} removed successfully.` });
  } catch (err) {
    console.error("DELETE /api/admin/users error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
