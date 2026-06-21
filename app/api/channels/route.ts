import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const memberships = await prisma.channelMember.findMany({
    where: { userId },
    include: {
      channel: {
        include: {
          members: {
            include: { user: { select: { id: true, name: true, avatar: true, jobTitle: true } } },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { sender: { select: { id: true, name: true } } },
          },
        },
      },
    },
    orderBy: { channel: { messages: { _count: "desc" } } },
  });

  const channels = memberships.map((m) => m.channel);

  // Sort: channels with latest message first
  channels.sort((a, b) => {
    const aTime = a.messages[0]?.createdAt?.getTime() ?? a.createdAt.getTime();
    const bTime = b.messages[0]?.createdAt?.getTime() ?? b.createdAt.getTime();
    return bTime - aTime;
  });

  return NextResponse.json(channels);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { type, name, memberIds } = await req.json();

  // For DM: check if channel already exists between these two users
  if (type === "direct") {
    const otherId = memberIds?.[0];
    if (!otherId) return NextResponse.json({ error: "Member required" }, { status: 400 });

    const existing = await prisma.channel.findFirst({
      where: {
        type: "direct",
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: otherId } } },
        ],
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, avatar: true, jobTitle: true } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: { select: { id: true, name: true } } } },
      },
    });

    if (existing) return NextResponse.json(existing);

    const channel = await prisma.channel.create({
      data: {
        type: "direct",
        createdBy: userId,
        members: {
          create: [{ userId }, { userId: otherId }],
        },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, avatar: true, jobTitle: true } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: { select: { id: true, name: true } } } },
      },
    });

    return NextResponse.json(channel, { status: 201 });
  }

  // Group channel
  if (!name?.trim()) return NextResponse.json({ error: "Channel name is required" }, { status: 400 });

  const allMembers = Array.from(new Set([userId, ...(memberIds ?? [])]));

  const channel = await prisma.channel.create({
    data: {
      type: "channel",
      name: name.trim(),
      createdBy: userId,
      members: {
        create: allMembers.map((uid: string) => ({ userId: uid })),
      },
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, avatar: true, jobTitle: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: { select: { id: true, name: true } } } },
    },
  });

  return NextResponse.json(channel, { status: 201 });
}
