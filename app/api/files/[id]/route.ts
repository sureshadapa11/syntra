import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { deleteS3Object } from "@/lib/s3";
import { presignDownload } from "@/lib/s3";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const file = await prisma.file.findUnique({ where: { id } });
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Extract S3 key from URL
  const key = file.url.split(".amazonaws.com/")[1];
  if (!key) return NextResponse.json({ downloadUrl: file.url });

  const downloadUrl = await presignDownload(key, file.name);
  return NextResponse.json({ downloadUrl });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const file = await prisma.file.findUnique({ where: { id } });
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const canDelete = session.user.id === file.uploadedById || ["admin", "hr"].includes(session.user.role);
  if (!canDelete) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Delete from S3
  const key = file.url.split(".amazonaws.com/")[1];
  if (key) {
    try { await deleteS3Object(key); } catch { /* ignore if already gone */ }
  }

  await prisma.file.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
