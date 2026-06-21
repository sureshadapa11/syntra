import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") ?? "mine"; // mine | team | all
  const status = searchParams.get("status") ?? "";
  const type = searchParams.get("type") ?? "";
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));

  const where: any = {
    ...(status ? { status } : {}),
    ...(type ? { type } : {}),
    startDate: {
      gte: new Date(year, 0, 1),
      lte: new Date(year, 11, 31),
    },
  };

  if (scope === "mine") {
    where.userId = session.user.id;
  }

  const leaves = await prisma.leave.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, avatar: true, jobTitle: true, department: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(leaves);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, startDate, endDate, daysCount, reason } = await req.json();

  if (!type || !startDate || !endDate || !daysCount) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  // Check for overlapping approved/pending leaves
  const overlap = await prisma.leave.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ["pending", "approved"] },
      OR: [
        { startDate: { lte: new Date(endDate) }, endDate: { gte: new Date(startDate) } },
      ],
    },
  });

  if (overlap) {
    return NextResponse.json({ error: "You already have a leave request overlapping these dates" }, { status: 409 });
  }

  // Check leave balance for annual/sick
  if (type === "annual" || type === "sick") {
    const balance = await prisma.leaveBalance.findFirst({
      where: { userId: session.user.id, year: new Date(startDate).getFullYear() },
    });

    if (balance) {
      const remaining = type === "annual"
        ? balance.annualTotal - balance.annualUsed
        : balance.sickTotal - balance.sickUsed;
      if (daysCount > remaining) {
        return NextResponse.json({ error: `Insufficient ${type} leave balance. Available: ${remaining} days` }, { status: 400 });
      }
    }
  }

  const leave = await prisma.leave.create({
    data: {
      userId: session.user.id,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      daysCount: parseFloat(daysCount),
      reason: reason || null,
      status: "pending",
      departmentId: session.user.departmentId || null,
    },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
  });

  return NextResponse.json(leave, { status: 201 });
}
