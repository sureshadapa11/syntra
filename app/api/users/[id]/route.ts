import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      role: true,
      department: true,
      team: true,
      manager: { select: { id: true, name: true, jobTitle: true, avatar: true } },
      directReports: { select: { id: true, name: true, jobTitle: true, avatar: true, status: true } },
      leaveBalances: { where: { year: new Date().getFullYear() } },
      attendance: { orderBy: { date: "desc" }, take: 5 },
      tasksAssigned: {
        where: { status: { not: "done" } },
        include: { project: { select: { name: true, key: true } } },
        take: 5,
      },
      assets: true,
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { password, ...safeUser } = user;
  return NextResponse.json(safeUser);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, email, jobTitle, phone, employmentType, departmentId, teamId, roleId, managerId, startDate, bio, skills, status, password } = body;

  const data: any = {
    name,
    email,
    jobTitle: jobTitle || null,
    phone: phone || null,
    employmentType: employmentType || "full-time",
    departmentId: departmentId || null,
    teamId: teamId || null,
    roleId,
    managerId: managerId || null,
    startDate: startDate ? new Date(startDate) : null,
    bio: bio || null,
    skills: skills ? JSON.parse(JSON.stringify(skills)) : null,
    status: status || "active",
  };

  if (password) {
    data.password = await bcrypt.hash(password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    include: {
      role: { select: { name: true } },
      department: { select: { id: true, name: true } },
      team: { select: { id: true, name: true } },
    },
  });

  const { password: _, ...safeUser } = user;
  return NextResponse.json(safeUser);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Soft delete — mark as inactive
  await prisma.user.update({
    where: { id },
    data: { status: "inactive" },
  });

  return NextResponse.json({ success: true });
}
