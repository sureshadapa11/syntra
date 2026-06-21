import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const isAdmin = ["admin", "manager", "hr"].includes(session.user.role ?? "");

  const existing = await prisma.announcement.findUnique({ where: { id }, select: { createdById: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isAdmin && existing.createdById !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data = await req.json();

  const announcement = await prisma.announcement.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.departmentId !== undefined && { departmentId: data.departmentId || null }),
      ...(data.pinned !== undefined && { pinned: data.pinned }),
    },
    include: {
      createdBy: { select: { id: true, name: true, avatar: true, jobTitle: true } },
      department: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(announcement);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const isAdmin = ["admin", "manager", "hr"].includes(session.user.role ?? "");

  const existing = await prisma.announcement.findUnique({ where: { id }, select: { createdById: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isAdmin && existing.createdById !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
