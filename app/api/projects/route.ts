import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";

  const isAdmin = session.user.role === "admin" || session.user.role === "manager";

  const projects = await prisma.project.findMany({
    where: {
      ...(search ? { name: { contains: search } } : {}),
      ...(!isAdmin ? { members: { some: { userId: session.user.id } } } : {}),
      status: { not: "archived" },
    },
    include: {
      lead: { select: { id: true, name: true, avatar: true } },
      members: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
      },
      _count: { select: { tasks: true, sprints: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, key, description, type, leadId } = await req.json();
  if (!name || !key) return NextResponse.json({ error: "Name and key are required" }, { status: 400 });

  const exists = await prisma.project.findUnique({ where: { key: key.toUpperCase() } });
  if (exists) return NextResponse.json({ error: "Project key already exists" }, { status: 409 });

  const project = await prisma.project.create({
    data: {
      name,
      key: key.toUpperCase(),
      description: description ?? null,
      type: type ?? "scrum",
      leadId: leadId ?? session.user.id,
      members: {
        create: { userId: session.user.id, role: "admin" },
      },
    },
    include: {
      lead: { select: { id: true, name: true, avatar: true } },
      members: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
      },
      _count: { select: { tasks: true, sprints: true } },
    },
  });

  return NextResponse.json(project, { status: 201 });
}
