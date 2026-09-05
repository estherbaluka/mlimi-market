// @ts-nocheck
import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { getSession } from "@/lib/auth";

const MAX_FILES = 5;
const MAX_SIZE = 5 * 1024 * 1024; // 5MB per file
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "You are not allowed to perform this action." }, { status: 401 });
    if (session.role !== "FARMER" && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Only farmers can upload product images." }, { status: 403 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files").filter((f) => f instanceof File) as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No image files provided." }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `You can upload at most ${MAX_FILES} images at a time.` }, { status: 400 });
    }

    for (const file of files) {
      if (!ALLOWED_MIME.has(file.type)) {
        return NextResponse.json({ error: `"${file.name}" is not supported. Use JPG, PNG or WebP.` }, { status: 400 });
      }
      if (file.size <= 0 || file.size > MAX_SIZE) {
        return NextResponse.json({ error: `"${file.name}" must be smaller than 5MB.` }, { status: 400 });
      }
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const urls: string[] = [];
    for (const file of files) {
      const ext = EXT_BY_MIME[file.type] || ".jpg";
      const filename = `${randomUUID()}${ext}`;
      const bytes = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(uploadDir, filename), bytes);
      urls.push(`/uploads/${filename}`);
    }

    return NextResponse.json({ message: "Images uploaded.", urls }, { status: 201 });
  } catch (err) {
    console.error("POST /api/uploads error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
