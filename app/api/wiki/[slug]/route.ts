import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;

  const page = await prisma.wikiPage.findUnique({
    where: { slug },
    include: {
      createdBy: { select: { id: true, name: true, avatar: true } },
      updatedBy: { select: { id: true, name: true, avatar: true } },
      parent: { select: { id: true, title: true, slug: true } },
      children: {
        select: { id: true, title: true, slug: true, _count: { select: { children: true } } },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(page);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const { title, content, parentId } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const page = await prisma.wikiPage.update({
    where: { slug },
    data: {
      title: title.trim(),
      content: content ?? "",
      parentId: parentId ?? null,
      updatedById: session.user.id,
    },
    include: {
      createdBy: { select: { id: true, name: true, avatar: true } },
      updatedBy: { select: { id: true, name: true, avatar: true } },
      parent: { select: { id: true, title: true, slug: true } },
      children: {
        select: { id: true, title: true, slug: true, _count: { select: { children: true } } },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  return NextResponse.json(page);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const page = await prisma.wikiPage.findUnique({
    where: { slug },
    include: { _count: { select: { children: true } } },
  });

  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const canDelete = session.user.id === page.createdById || session.user.role === "admin";
  if (!canDelete) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (page._count.children > 0) {
    return NextResponse.json({ error: "Delete all sub-pages first" }, { status: 409 });
  }

  await prisma.wikiPage.delete({ where: { slug } });
  return NextResponse.json({ ok: true });
}
