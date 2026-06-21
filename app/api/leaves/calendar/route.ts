import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // YYYY-MM

  let dateFilter: any = {};
  if (month) {
    const [year, mon] = month.split("-").map(Number);
    dateFilter = {
      startDate: { lte: new Date(year, mon, 0) },
      endDate: { gte: new Date(year, mon - 1, 1) },
    };
  }

  const leaves = await prisma.leave.findMany({
    where: { status: "approved", ...dateFilter },
    include: {
      user: { select: { id: true, name: true, avatar: true, department: { select: { name: true } } } },
    },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json(leaves);
}
