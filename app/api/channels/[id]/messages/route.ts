import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const after = searchParams.get("after"); // message id — for polling new messages
  const cursor = searchParams.get("cursor"); // createdAt ISO — for pagination (older messages)

  const isMember = await prisma.channelMember.findFirst({
    where: { channelId: id, userId: session.user.id },
  });
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (after) {
    // Poll: only messages newer than `after` message id
    const pivot = await prisma.message.findUnique({ where: { id: after }, select: { createdAt: true } });
    if (!pivot) return NextResponse.json([]);

    const messages = await prisma.message.findMany({
      where: { channelId: id, createdAt: { gt: pivot.createdAt } },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(messages);
  }

  // Initial load or pagination
  const messages = await prisma.message.findMany({
    where: {
      channelId: id,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    include: { sender: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(messages.reverse());
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });

  const isMember = await prisma.channelMember.findFirst({
    where: { channelId: id, userId: session.user.id },
  });
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const message = await prisma.message.create({
    data: { channelId: id, senderId: session.user.id, content: content.trim() },
    include: { sender: { select: { id: true, name: true, avatar: true } } },
  });

  return NextResponse.json(message, { status: 201 });
}
