import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const type = searchParams.get("type") ?? "";
  const status = searchParams.get("status") ?? "";
  const assignedToId = searchParams.get("assignedToId") ?? "";

  const assets = await prisma.asset.findMany({
    where: {
      ...(search && {
        OR: [
          { name: { contains: search } },
          { serialNumber: { contains: search } },
          { type: { contains: search } },
        ],
      }),
      ...(type && { type }),
      ...(status && { status }),
      ...(assignedToId && { assignedToId }),
    },
    include: {
      assignedTo: {
        select: { id: true, name: true, avatar: true, jobTitle: true, department: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(assets);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["admin", "hr", "it"].includes(session.user.role ?? "");
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, type, serialNumber } = await req.json();
  if (!name?.trim() || !type?.trim())
    return NextResponse.json({ error: "Name and type are required" }, { status: 400 });

  const asset = await prisma.asset.create({
    data: {
      name: name.trim(),
      type: type.trim(),
      serialNumber: serialNumber?.trim() || null,
      status: "available",
    },
    include: {
      assignedTo: {
        select: { id: true, name: true, avatar: true, jobTitle: true, department: { select: { name: true } } },
      },
    },
  });

  return NextResponse.json(asset, { status: 201 });
}
