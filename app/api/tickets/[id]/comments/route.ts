import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: ticketId } = await params;

  const { content, internal } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const isAgent = ["admin", "manager", "hr", "it"].includes(session.user.role ?? "");

  const comment = await prisma.ticketComment.create({
    data: {
      ticketId,
      userId: session.user.id,
      content,
      internal: isAgent && !!internal,
    },
    include: {
      user: { select: { id: true, name: true, avatar: true, role: { select: { name: true } } } },
    },
  });

  // Auto-move to in-progress when agent first replies
  if (!internal) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, select: { status: true, assignedToId: true } });
    if (ticket?.status === "open" && isAgent) {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: "in-progress",
          ...(ticket.assignedToId === null && { assignedToId: session.user.id }),
        },
      });
    }
  }

  return NextResponse.json(comment, { status: 201 });
}
