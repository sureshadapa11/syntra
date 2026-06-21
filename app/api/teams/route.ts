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
