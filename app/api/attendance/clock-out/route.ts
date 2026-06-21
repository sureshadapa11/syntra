import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.attendance.findUnique({
    where: { userId_date: { userId: session.user.id, date: today } },
  });

  if (!existing || !existing.clockIn) {
    return NextResponse.json({ error: "You haven't clocked in yet" }, { status: 400 });
  }

  if (existing.clockOut) {
    return NextResponse.json({ error: "Already clocked out today" }, { status: 409 });
  }

  const record = await prisma.attendance.update({
    where: { id: existing.id },
    data: { clockOut: new Date() },
  });

  return NextResponse.json(record);
}
