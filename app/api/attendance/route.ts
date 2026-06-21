import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? session.user.id;
  const month = searchParams.get("month"); // YYYY-MM
  const limit = parseInt(searchParams.get("limit") ?? "30");

  let dateFilter: any = {};
  if (month) {
    const [year, mon] = month.split("-").map(Number);
    dateFilter = {
      date: {
        gte: new Date(year, mon - 1, 1),
        lt: new Date(year, mon, 1),
      },
    };
  }

  const records = await prisma.attendance.findMany({
    where: { userId, ...dateFilter },
    orderBy: { date: "desc" },
    take: limit,
  });

  return NextResponse.json(records);
}
