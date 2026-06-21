import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["admin", "hr", "it"].includes(session.user.role ?? "");
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const data = await req.json();

  // Handle assign/unassign logic
  let extraData: Record<string, any> = {};
  if (data.assignedToId !== undefined) {
    if (data.assignedToId) {
      extraData = { status: "assigned", assignedDate: new Date() };
    } else {
      extraData = { status: "available", assignedDate: null };
    }
  }

  const asset = await prisma.asset.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.serialNumber !== undefined && { serialNumber: data.serialNumber || null }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.assignedToId !== undefined && {
        assignedToId: data.assignedToId || null,
      }),
      ...extraData,
    },
    include: {
      assignedTo: {
        select: { id: true, name: true, avatar: true, jobTitle: true, department: { select: { name: true } } },
      },
    },
  });

  return NextResponse.json(asset);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["admin", "hr", "it"].includes(session.user.role ?? "");
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.asset.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
