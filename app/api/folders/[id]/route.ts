import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const folder = await prisma.folder.update({
    where: { id },
    data: { name: name.trim() },
    include: { _count: { select: { files: true, children: true } }, createdBy: { select: { id: true, name: true } } },
  });

  return NextResponse.json(folder);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const folder = await prisma.folder.findUnique({
    where: { id },
    include: { _count: { select: { files: true, children: true } } },
  });

  if (!folder) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const canDelete = session.user.id === folder.createdById || ["admin", "hr"].includes(session.user.role);
  if (!canDelete) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (folder._count.files > 0 || folder._count.children > 0) {
    return NextResponse.json({ error: "Folder is not empty — delete its contents first" }, { status: 409 });
  }

  await prisma.folder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
