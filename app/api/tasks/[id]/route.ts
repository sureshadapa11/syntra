import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      reporter: { select: { id: true, name: true, avatar: true } },
      epic: { select: { id: true, name: true, color: true } },
      sprint: { select: { id: true, name: true, status: true } },
      project: { select: { id: true, name: true, key: true, type: true } },
      subtasks: {
        include: { assignee: { select: { id: true, name: true, avatar: true } } },
        orderBy: { order: "asc" },
      },
      comments: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "asc" },
      },
      timeLogs: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { loggedDate: "desc" },
      },
      labels: { include: { label: true } },
      _count: { select: { comments: true, subtasks: true } },
    },
  });

  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(task);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const data = await req.json();

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
      ...(data.sprintId !== undefined && { sprintId: data.sprintId }),
      ...(data.epicId !== undefined && { epicId: data.epicId }),
      ...(data.storyPoints !== undefined && { storyPoints: data.storyPoints }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
      ...(data.order !== undefined && { order: data.order }),
    },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      reporter: { select: { id: true, name: true, avatar: true } },
      epic: { select: { id: true, name: true, color: true } },
      sprint: { select: { id: true, name: true, status: true } },
      labels: { include: { label: true } },
      _count: { select: { comments: true, subtasks: true } },
    },
  });

  return NextResponse.json(task);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
