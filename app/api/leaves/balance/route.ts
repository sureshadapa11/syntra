import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? session.user.id;
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));

  let balance = await prisma.leaveBalance.findFirst({ where: { userId, year } });

  if (!balance) {
    balance = await prisma.leaveBalance.create({
      data: { userId, year, annualTotal: 20, annualUsed: 0, sickTotal: 10, sickUsed: 0 },
    });
  }

  return NextResponse.json(balance);
}
