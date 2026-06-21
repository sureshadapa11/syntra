import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");

  const date = dateParam ? new Date(dateParam) : new Date();
  date.setHours(0, 0, 0, 0);

  // Get all active users with their attendance for the date
  const users = await prisma.user.findMany({
    where: { status: "active" },
    select: {
      id: true,
      name: true,
      avatar: true,
      jobTitle: true,
      department: { select: { name: true } },
      attendance: {
        where: { date },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  const result = users.map((u) => ({
    id: u.id,
    name: u.name,
    avatar: u.avatar,
    jobTitle: u.jobTitle,
    department: u.department?.name ?? null,
    attendance: u.attendance[0] ?? null,
  }));

  return NextResponse.json(result);
}
