import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type = "office", notes } = await req.json().catch(() => ({}));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.attendance.findUnique({
    where: { userId_date: { userId: session.user.id, date: today } },
  });

  if (existing) {
    if (existing.clockIn) {
      return NextResponse.json({ error: "Already clocked in today" }, { status: 409 });
    }
    const record = await prisma.attendance.update({
      where: { id: existing.id },
      data: { clockIn: new Date(), type, notes: notes || null },
    });
    return NextResponse.json(record);
  }

  const record = await prisma.attendance.create({
    data: {
      userId: session.user.id,
      date: today,
      clockIn: new Date(),
      type,
      notes: notes || null,
    },
  });

  return NextResponse.json(record, { status: 201 });
}
