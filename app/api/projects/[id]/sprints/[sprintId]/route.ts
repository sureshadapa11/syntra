import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sprintId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { sprintId } = await params;

  const data = await req.json();

  // When completing a sprint, move unfinished tasks to backlog
  if (data.status === "completed") {
    await prisma.task.updateMany({
      where: { sprintId, status: { not: "done" } },
      data: { sprintId: null },
    });
  }

  const sprint = await prisma.sprint.update({
    where: { id: sprintId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.goal !== undefined && { goal: data.goal }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
      ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
    },
    include: { _count: { select: { tasks: true } } },
  });

  return NextResponse.json(sprint);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; sprintId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { sprintId } = await params;

  // Move tasks back to backlog
  await prisma.task.updateMany({ where: { sprintId }, data: { sprintId: null } });
  await prisma.sprint.delete({ where: { id: sprintId } });
  return NextResponse.json({ success: true });
}
