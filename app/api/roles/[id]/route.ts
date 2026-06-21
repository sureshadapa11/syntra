import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { name, permissions } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const role = await prisma.role.update({
    where: { id },
    data: { name: name.trim(), permissions: permissions ?? {} },
    include: { _count: { select: { users: true } } },
  });

  return NextResponse.json(role);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const userCount = await prisma.user.count({ where: { roleId: id } });
  if (userCount > 0) {
    return NextResponse.json({ error: `Cannot delete — ${userCount} user(s) have this role` }, { status: 409 });
  }

  await prisma.role.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
