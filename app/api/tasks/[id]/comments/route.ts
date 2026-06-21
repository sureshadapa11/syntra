import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: taskId } = await params;

  const comments = await prisma.taskComment.findMany({
    where: { taskId },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: taskId } = await params;

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const comment = await prisma.taskComment.create({
    data: { taskId, userId: session.user.id, content },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });

  return NextResponse.json(comment, { status: 201 });
}
