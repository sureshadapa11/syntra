import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { presignUpload, filePublicUrl } from "@/lib/s3";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fileName, mimeType } = await req.json();
  if (!fileName || !mimeType) return NextResponse.json({ error: "fileName and mimeType required" }, { status: 400 });

  const ext = fileName.split(".").pop() ?? "";
  const key = `uploads/${session.user.id}/${randomUUID()}${ext ? "." + ext : ""}`;

  const uploadUrl = await presignUpload(key, mimeType);

  return NextResponse.json({ uploadUrl, key, fileUrl: filePublicUrl(key) });
}
