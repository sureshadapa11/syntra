import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const departmentId = searchParams.get("departmentId") ?? "";
  const teamId = searchParams.get("teamId") ?? "";
  const status = searchParams.get("status") ?? "";

  const users = await prisma.user.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search } },
                { email: { contains: search } },
                { jobTitle: { contains: search } },
              ],
            }
          : {},
        departmentId ? { departmentId } : {},
        teamId ? { teamId } : {},
        status ? { status } : {},
      ],
    },
    include: {
      role: { select: { name: true } },
      department: { select: { id: true, name: true } },
      team: { select: { id: true, name: true } },
      manager: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, email, password, jobTitle, phone, employmentType, departmentId, teamId, roleId, managerId, startDate, bio, skills } = body;

  if (!name || !email || !roleId) {
    return NextResponse.json({ error: "Name, email and role are required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }

  const hashedPassword = password ? await bcrypt.hash(password, 10) : await bcrypt.hash("Welcome@123", 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
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
      status: "active",
    },
    include: {
      role: { select: { name: true } },
      department: { select: { id: true, name: true } },
    },
  });

  // Create leave balance for new user
  await prisma.leaveBalance.create({
    data: {
      userId: user.id,
      year: new Date().getFullYear(),
      annualTotal: 20,
      annualUsed: 0,
      sickTotal: 10,
      sickUsed: 0,
    },
  });

  return NextResponse.json(user, { status: 201 });
}
