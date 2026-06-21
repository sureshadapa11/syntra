import { prisma } from "@/lib/prisma";
import { PeopleClient } from "./people-client";

export default async function PeoplePage() {
  const [users, departments, roles] = await Promise.all([
    prisma.user.findMany({
      include: {
        role: { select: { name: true } },
        department: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
  ]);

  return <PeopleClient initialUsers={users} departments={departments} roles={roles} />;
}
