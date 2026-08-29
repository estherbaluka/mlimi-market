import { NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const users = await db.orm.public.User.where({ email })
      .select("id", "name", "email", "passwordHash", "role")
      .all();

    const user = users[0];

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, (user as unknown as { passwordHash: string }).passwordHash);

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    await createSession({
      userId: (user as unknown as { id: number }).id,
      email: (user as unknown as { email: string }).email,
      role: (user as unknown as { role: "FARMER" | "BUYER" | "ADMIN" }).role,
      name: (user as unknown as { name: string | null }).name,
    });

    return NextResponse.json({
      message: "Login successful",
      user: {
        id: (user as unknown as { id: number }).id,
        name: (user as unknown as { name: string | null }).name,
        email: (user as unknown as { email: string }).email,
        role: (user as unknown as { role: string }).role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
