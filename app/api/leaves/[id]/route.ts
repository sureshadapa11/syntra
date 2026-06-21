import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const leave = await prisma.leave.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, avatar: true, jobTitle: true } } },
  });

  if (!leave) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(leave);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { action } = await req.json(); // approve | reject | cancel

  const leave = await prisma.leave.findUnique({ where: { id } });
  if (!leave) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "cancel") {
    if (leave.userId !== session.user.id) {
      return NextResponse.json({ error: "Cannot cancel another user's leave" }, { status: 403 });
    }
    if (!["pending"].includes(leave.status)) {
      return NextResponse.json({ error: "Only pending leaves can be cancelled" }, { status: 400 });
    }
    const updated = await prisma.leave.update({ where: { id }, data: { status: "cancelled" } });
    return NextResponse.json(updated);
  }

  // approve / reject — manager/admin only
  if (action === "approve") {
    const updated = await prisma.leave.update({
      where: { id },
      data: { status: "approved", approvedById: session.user.id, approvedAt: new Date() },
    });

    // Deduct from balance
    if (leave.type === "annual" || leave.type === "sick") {
      const balance = await prisma.leaveBalance.findFirst({
        where: { userId: leave.userId, year: leave.startDate.getFullYear() },
      });
      if (balance) {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: leave.type === "annual"
            ? { annualUsed: { increment: leave.daysCount } }
            : { sickUsed: { increment: leave.daysCount } },
        });
      }
    }

    return NextResponse.json(updated);
  }

  if (action === "reject") {
    const updated = await prisma.leave.update({
      where: { id },
      data: { status: "rejected", approvedById: session.user.id, approvedAt: new Date() },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
