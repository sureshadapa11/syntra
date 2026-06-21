import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get("departmentId") ?? "";
  const search = searchParams.get("search") ?? "";

  const announcements = await prisma.announcement.findMany({
    where: {
      ...(departmentId === "company"
        ? { departmentId: null }
        : departmentId
        ? { departmentId }
        : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { content: { contains: search } },
            ],
          }
        : {}),
    },
    include: {
      createdBy: { select: { id: true, name: true, avatar: true, jobTitle: true } },
      department: { select: { id: true, name: true } },
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(announcements);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const canPost = ["admin", "manager", "hr"].includes(session.user.role ?? "");
  if (!canPost) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, content, departmentId, pinned } = await req.json();
  if (!title?.trim() || !content?.trim())
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });

  const announcement = await prisma.announcement.create({
    data: {
      title: title.trim(),
      content: content.trim(),
      departmentId: departmentId || null,
      pinned: pinned ?? false,
      createdById: session.user.id,
    },
    include: {
      createdBy: { select: { id: true, name: true, avatar: true, jobTitle: true } },
      department: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(announcement, { status: 201 });
}
