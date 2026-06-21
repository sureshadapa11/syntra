import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Roles
  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: {
      name: "admin",
      permissions: {
        users: ["read", "write", "delete"],
        projects: ["read", "write", "delete"],
        tickets: ["read", "write", "delete"],
        leaves: ["read", "write", "delete"],
        announcements: ["read", "write", "delete"],
        settings: ["read", "write"],
      },
    },
  });

  await prisma.role.upsert({
    where: { name: "manager" },
    update: {},
    create: {
      name: "manager",
      permissions: {
        users: ["read"],
        projects: ["read", "write"],
        tickets: ["read", "write"],
        leaves: ["read", "write"],
        announcements: ["read", "write"],
      },
    },
  });

  await prisma.role.upsert({
    where: { name: "developer" },
    update: {},
    create: {
      name: "developer",
      permissions: {
        projects: ["read", "write"],
        tickets: ["read", "write"],
        leaves: ["read"],
      },
    },
  });

  await prisma.role.upsert({
    where: { name: "hr" },
    update: {},
    create: {
      name: "hr",
      permissions: {
        users: ["read", "write"],
        leaves: ["read", "write", "delete"],
        announcements: ["read", "write"],
      },
    },
  });

  // Department
  const engineering = await prisma.department.upsert({
    where: { id: "dept-engineering" },
    update: {},
    create: {
      id: "dept-engineering",
      name: "Engineering",
      description: "Software development team",
    },
  });

  // Admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@syntra.app" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@syntra.app",
      password: hashedPassword,
      jobTitle: "Administrator",
      roleId: adminRole.id,
      departmentId: engineering.id,
      status: "active",
    },
  });

  // Leave balance for admin
  await prisma.leaveBalance.upsert({
    where: { userId_year: { userId: admin.id, year: 2025 } },
    update: {},
    create: {
      userId: admin.id,
      year: 2025,
      annualTotal: 20,
      annualUsed: 0,
      sickTotal: 10,
      sickUsed: 0,
    },
  });

  // Public holidays
  const holidays = [
    { name: "New Year's Day", date: new Date("2025-01-01") },
    { name: "Republic Day", date: new Date("2025-01-26") },
    { name: "Holi", date: new Date("2025-03-14") },
    { name: "Good Friday", date: new Date("2025-04-18") },
    { name: "Independence Day", date: new Date("2025-08-15") },
    { name: "Gandhi Jayanti", date: new Date("2025-10-02") },
    { name: "Diwali", date: new Date("2025-10-20") },
    { name: "Christmas", date: new Date("2025-12-25") },
  ];

  for (const holiday of holidays) {
    await prisma.publicHoliday.upsert({
      where: { id: `holiday-${holiday.name.replace(/\s/g, "-").toLowerCase()}` },
      update: {},
      create: {
        id: `holiday-${holiday.name.replace(/\s/g, "-").toLowerCase()}`,
        ...holiday,
        country: "IN",
      },
    });
  }

  console.log("✅ Seed complete");
  console.log("   Admin login: admin@syntra.app / admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
