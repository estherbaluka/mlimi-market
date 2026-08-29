import { NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { hashPassword, createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      phone,
      password,
      role,
      farmName,
      location,
      bio,
      defaultAddress,
      city,
      district,
    } = parsed.data;

    // Check existing user
    const existing = await db.orm.public.User.where({ email })
      .select("id")
      .all();

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Create user - Prisma 8 uses flat object, not {data: ...}
    const created = await db.orm.public.User.create({
      name,
      email,
      phone: phone || null,
      passwordHash,
      role,
    });

    const userId = (created as unknown as { id: number }).id;

    // Create profile based on role
    if (role === "FARMER") {
      await db.orm.public.FarmerProfile.create({
        userId,
        farmName: farmName!,
        location: location!,
        bio: bio || null,
      });
    } else if (role === "BUYER") {
      await db.orm.public.BuyerProfile.create({
        userId,
        defaultAddress: defaultAddress || null,
        city: city || null,
        district: district || null,
      });
    }

    await createSession({
      userId,
      email,
      role,
      name,
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: { id: userId, name, email, role },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
