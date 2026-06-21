import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: projectId } = await params;

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: {
        select: { id: true, name: true, avatar: true, jobTitle: true, email: true, department: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(members);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: projectId } = await params;
  const { userId, role } = await req.json();

  const existing = await prisma.projectMember.findUnique({ where: { projectId_userId: { projectId, userId } } });
  if (existing) return NextResponse.json({ error: "Already a member" }, { status: 409 });

  const member = await prisma.projectMember.create({
    data: { projectId, userId, role: role ?? "member" },
    include: {
      user: { select: { id: true, name: true, avatar: true, jobTitle: true, email: true } },
    },
  });

  return NextResponse.json(member, { status: 201 });
}
