import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "hr"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { name, description, headId } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const dept = await prisma.department.update({
    where: { id },
    data: { name: name.trim(), description: description?.trim() || null, headId: headId || null },
    include: { _count: { select: { users: true, teams: true } } },
  });

  return NextResponse.json(dept);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const userCount = await prisma.user.count({ where: { departmentId: id } });
  if (userCount > 0) {
    return NextResponse.json({ error: `Cannot delete — ${userCount} employee(s) are in this department` }, { status: 409 });
  }

  await prisma.department.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
