import { prisma } from "@/lib/prisma";
import { getInitials, formatDate } from "@/lib/utils";
import { Users, Search, Plus } from "lucide-react";

export default async function PeoplePage() {
  const users = await prisma.user.findMany({
    include: { role: true, department: true, team: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">People</h1>
          <p className="text-slate-500 mt-1">{users.length} team members</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} />
          Add Employee
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search employees..."
            className="flex-1 text-sm focus:outline-none text-slate-600 placeholder:text-slate-400"
          />
        </div>

        <div className="divide-y divide-slate-100">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Users size={40} className="mb-3 opacity-40" />
              <p className="font-medium">No employees yet</p>
              <p className="text-sm mt-1">Add your first team member</p>
            </div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium shrink-0">
                  {getInitials(user.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <div className="hidden md:block text-sm text-slate-600">
                  {user.jobTitle ?? "—"}
                </div>
                <div className="hidden md:block text-sm text-slate-500">
                  {user.department?.name ?? "—"}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                  user.status === "active"
                    ? "bg-green-50 text-green-700"
                    : "bg-slate-100 text-slate-600"
                }`}>
                  {user.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
