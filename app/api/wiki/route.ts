import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const flat = searchParams.get("flat") === "1";

  if (search) {
    const pages = await prisma.wikiPage.findMany({
      where: {
        OR: [
          { title: { contains: search } },
          { content: { contains: search } },
        ],
      },
      include: {
        createdBy: { select: { id: true, name: true, avatar: true } },
        updatedBy: { select: { id: true, name: true } },
        _count: { select: { children: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });
    return NextResponse.json(pages);
  }

  const pages = await prisma.wikiPage.findMany({
    where: flat ? {} : { parentId: null },
    include: {
      createdBy: { select: { id: true, name: true, avatar: true } },
      updatedBy: { select: { id: true, name: true } },
      _count: { select: { children: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(pages);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, content, parentId } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const base = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  let slug = base;
  let attempt = 0;
  while (await prisma.wikiPage.findUnique({ where: { slug } })) {
    attempt++;
    slug = `${base}-${attempt}`;
  }

  const page = await prisma.wikiPage.create({
    data: {
      title: title.trim(),
      content: content ?? "",
      slug,
      parentId: parentId ?? null,
      createdById: session.user.id,
    },
    include: {
      createdBy: { select: { id: true, name: true, avatar: true } },
      _count: { select: { children: true } },
    },
  });

  return NextResponse.json(page, { status: 201 });
}
