import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      raisedBy: { select: { id: true, name: true, avatar: true, email: true, jobTitle: true, department: { select: { name: true } } } },
      assignedTo: { select: { id: true, name: true, avatar: true, jobTitle: true } },
      comments: {
        include: { user: { select: { id: true, name: true, avatar: true, role: { select: { name: true } } } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(ticket);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const data = await req.json();

  const ticket = await prisma.ticket.update({
    where: { id },
    data: {
      ...(data.status !== undefined && {
        status: data.status,
        ...(data.status === "resolved" && { resolvedAt: new Date() }),
        ...(data.status === "open" && { resolvedAt: null }),
      }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId || null }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
    },
    include: {
      raisedBy: { select: { id: true, name: true, avatar: true, department: { select: { name: true } } } },
      assignedTo: { select: { id: true, name: true, avatar: true } },
      _count: { select: { comments: true } },
    },
  });

  return NextResponse.json(ticket);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await prisma.ticket.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
