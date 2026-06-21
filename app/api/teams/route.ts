import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get("departmentId");

  const teams = await prisma.team.findMany({
    where: departmentId ? { departmentId } : {},
    include: { department: { select: { name: true } }, _count: { select: { users: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(teams);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "hr"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, departmentId, leadId } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!departmentId) return NextResponse.json({ error: "Department is required" }, { status: 400 });

  const team = await prisma.team.create({
    data: { name: name.trim(), departmentId, leadId: leadId || null },
    include: { department: { select: { name: true } }, _count: { select: { users: true } } },
  });

  return NextResponse.json(team, { status: 201 });
}
