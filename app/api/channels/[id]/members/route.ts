import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const existing = await prisma.channelMember.findFirst({ where: { channelId: id, userId } });
  if (existing) return NextResponse.json({ error: "Already a member" }, { status: 409 });

  await prisma.channelMember.create({ data: { channelId: id, userId } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { userId } = await req.json();

  const targetId = userId ?? session.user.id;
  await prisma.channelMember.deleteMany({ where: { channelId: id, userId: targetId } });
  return NextResponse.json({ ok: true });
}
