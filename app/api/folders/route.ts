import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const parentId = searchParams.get("parentId") ?? null;

  const folders = await prisma.folder.findMany({
    where: { parentId },
    include: {
      _count: { select: { files: true, children: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(folders);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, parentId } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const folder = await prisma.folder.create({
    data: {
      name: name.trim(),
      parentId: parentId ?? null,
      createdById: session.user.id,
    },
    include: {
      _count: { select: { files: true, children: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(folder, { status: 201 });
}
