import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const departments = await prisma.department.findMany({
    include: { _count: { select: { users: true, teams: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(departments);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, headId } = await req.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const dept = await prisma.department.create({
    data: { name, description: description || null, headId: headId || null },
  });

  return NextResponse.json(dept, { status: 201 });
}
