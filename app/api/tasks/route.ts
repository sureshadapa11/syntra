import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const sprintId = searchParams.get("sprintId"); // "null" = backlog, omit = all
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const assigneeId = searchParams.get("assigneeId");
  const epicId = searchParams.get("epicId");

  const tasks = await prisma.task.findMany({
    where: {
      ...(projectId && { projectId }),
      ...(sprintId === "null" ? { sprintId: null } : sprintId ? { sprintId } : {}),
      ...(status && { status }),
      ...(type && { type }),
      ...(assigneeId && { assigneeId }),
      ...(epicId && { epicId }),
    },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      reporter: { select: { id: true, name: true, avatar: true } },
      epic: { select: { id: true, name: true, color: true } },
      sprint: { select: { id: true, name: true, status: true } },
      labels: { include: { label: true } },
      _count: { select: { comments: true, subtasks: true } },
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, sprintId, epicId, parentId, title, description, type, priority, assigneeId, storyPoints, dueDate } = await req.json();

  if (!projectId || !title) return NextResponse.json({ error: "projectId and title are required" }, { status: 400 });

  const maxOrder = await prisma.task.aggregate({
    where: { projectId, sprintId: sprintId ?? null },
    _max: { order: true },
  });

  const task = await prisma.task.create({
    data: {
      projectId,
      sprintId: sprintId ?? null,
      epicId: epicId ?? null,
      parentId: parentId ?? null,
      title,
      description: description ?? null,
      type: type ?? "task",
      priority: priority ?? "medium",
      assigneeId: assigneeId ?? null,
      reporterId: session.user.id,
      storyPoints: storyPoints ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
      order: (maxOrder._max.order ?? 0) + 1,
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

  return NextResponse.json(task, { status: 201 });
}
