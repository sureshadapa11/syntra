import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") ?? "mine"; // mine | all
  const status = searchParams.get("status") ?? "";
  const priority = searchParams.get("priority") ?? "";
  const category = searchParams.get("category") ?? "";
  const search = searchParams.get("search") ?? "";

  const isAgent = ["admin", "manager", "hr", "it"].includes(session.user.role ?? "");

  const tickets = await prisma.ticket.findMany({
    where: {
      ...(scope === "mine" && !isAgent ? { raisedById: session.user.id } : {}),
      ...(scope === "assigned" ? { assignedToId: session.user.id } : {}),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(category && { category }),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
        ],
      }),
    },
    include: {
      raisedBy: { select: { id: true, name: true, avatar: true, department: { select: { name: true } } } },
      assignedTo: { select: { id: true, name: true, avatar: true } },
      _count: { select: { comments: true } },
    },
    orderBy: [
      { status: "asc" },
      { priority: "asc" },
      { createdAt: "desc" },
    ],
  });

  return NextResponse.json(tickets);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, category, priority } = await req.json();
  if (!title || !category) return NextResponse.json({ error: "Title and category are required" }, { status: 400 });

  // SLA: critical=4h, high=8h, medium=24h, low=72h
  const slaHours: Record<string, number> = { critical: 4, high: 8, medium: 24, low: 72 };
  const hours = slaHours[priority ?? "medium"] ?? 24;
  const slaDeadline = new Date(Date.now() + hours * 60 * 60 * 1000);

  const ticket = await prisma.ticket.create({
    data: {
      title,
      description: description ?? null,
      category,
      priority: priority ?? "medium",
      status: "open",
      raisedById: session.user.id,
      slaDeadline,
    },
    include: {
      raisedBy: { select: { id: true, name: true, avatar: true, department: { select: { name: true } } } },
      assignedTo: { select: { id: true, name: true, avatar: true } },
      _count: { select: { comments: true } },
    },
  });

  return NextResponse.json(ticket, { status: 201 });
}
