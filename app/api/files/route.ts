import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId") ?? null;
  const search = searchParams.get("search") ?? "";

  const files = await prisma.file.findMany({
    where: {
      folderId: search ? undefined : folderId,
      ...(search ? { name: { contains: search } } : {}),
    },
    include: { uploadedBy: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(files);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, url, size, mimeType, folderId } = await req.json();
  if (!name || !url || !mimeType) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const file = await prisma.file.create({
    data: {
      name,
      url,
      size: size ?? 0,
      mimeType,
      folderId: folderId ?? null,
      uploadedById: session.user.id,
    },
    include: { uploadedBy: { select: { id: true, name: true, avatar: true } } },
  });

  return NextResponse.json(file, { status: 201 });
}
