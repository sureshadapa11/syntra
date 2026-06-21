import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const EPIC_COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#ef4444", "#14b8a6"];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: projectId } = await params;

  const epics = await prisma.epic.findMany({
    where: { projectId },
    include: { _count: { select: { tasks: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(epics);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: projectId } = await params;

  const { name, description, startDate, endDate, color } = await req.json();
  if (!name) return NextResponse.json({ error: "Epic name required" }, { status: 400 });

  const count = await prisma.epic.count({ where: { projectId } });

  const epic = await prisma.epic.create({
    data: {
      projectId,
      name,
      description: description ?? null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      color: color ?? EPIC_COLORS[count % EPIC_COLORS.length],
      status: "open",
    },
    include: { _count: { select: { tasks: true } } },
  });

  return NextResponse.json(epic, { status: 201 });
}
