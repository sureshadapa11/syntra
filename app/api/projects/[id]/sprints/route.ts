import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: projectId } = await params;

  const sprints = await prisma.sprint.findMany({
    where: { projectId },
    include: { _count: { select: { tasks: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(sprints);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: projectId } = await params;

  const { name, goal, startDate, endDate } = await req.json();
  if (!name) return NextResponse.json({ error: "Sprint name required" }, { status: 400 });

  const sprint = await prisma.sprint.create({
    data: {
      projectId,
      name,
      goal: goal ?? null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      status: "planning",
    },
    include: { _count: { select: { tasks: true } } },
  });

  return NextResponse.json(sprint, { status: 201 });
}
