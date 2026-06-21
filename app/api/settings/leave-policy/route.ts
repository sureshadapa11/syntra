import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const year = new Date().getFullYear();
  const sample = await prisma.leaveBalance.findFirst({ where: { year } });

  return NextResponse.json({
    year,
    annualTotal: sample?.annualTotal ?? 20,
    sickTotal: sample?.sickTotal ?? 10,
    totalEmployees: await prisma.user.count({ where: { status: "active" } }),
    balancesExist: await prisma.leaveBalance.count({ where: { year } }),
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "hr"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { annualTotal, sickTotal } = await req.json();
  if (typeof annualTotal !== "number" || typeof sickTotal !== "number") {
    return NextResponse.json({ error: "Invalid values" }, { status: 400 });
  }

  const year = new Date().getFullYear();

  await prisma.leaveBalance.updateMany({
    where: { year },
    data: { annualTotal, sickTotal },
  });

  const activeUsers = await prisma.user.findMany({
    where: { status: "active" },
    select: { id: true },
  });

  const existingIds = (await prisma.leaveBalance.findMany({ where: { year }, select: { userId: true } })).map((b) => b.userId);
  const missing = activeUsers.filter((u) => !existingIds.includes(u.id));

  if (missing.length > 0) {
    await prisma.leaveBalance.createMany({
      data: missing.map((u) => ({ userId: u.id, year, annualTotal, sickTotal, annualUsed: 0, sickUsed: 0 })),
    });
  }

  return NextResponse.json({ ok: true, updated: existingIds.length, created: missing.length });
}
