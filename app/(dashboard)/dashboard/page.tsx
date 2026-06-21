import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Users,
  Clock,
  FolderKanban,
  Ticket,
  TrendingUp,
  CheckSquare,
  Calendar,
  AlertCircle,
} from "lucide-react";

async function getStats() {
  const [totalUsers, openTickets, activeProjects, pendingLeaves] =
    await Promise.all([
      prisma.user.count({ where: { status: "active" } }),
      prisma.ticket.count({ where: { status: "open" } }),
      prisma.project.count({ where: { status: "active" } }),
      prisma.leave.count({ where: { status: "pending" } }),
    ]);
  return { totalUsers, openTickets, activeProjects, pendingLeaves };
}

export default async function DashboardPage() {
  const session = await auth();
  const stats = await getStats();

  const cards = [
    {
      label: "Active Employees",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-blue-50 text-blue-600",
      trend: "+2 this month",
    },
    {
      label: "Active Projects",
      value: stats.activeProjects,
      icon: FolderKanban,
      color: "bg-purple-50 text-purple-600",
      trend: "3 in sprint",
    },
    {
      label: "Open Tickets",
      value: stats.openTickets,
      icon: Ticket,
      color: "bg-orange-50 text-orange-600",
      trend: "Needs attention",
    },
    {
      label: "Pending Leaves",
      value: stats.pendingLeaves,
      icon: Calendar,
      color: "bg-green-50 text-green-600",
      trend: "Awaiting approval",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Good morning, {session?.user.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-slate-500 mt-1">Here's what's happening today</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-slate-200 p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <div className={`p-2 rounded-lg ${card.color}`}>
                <card.icon size={16} />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <TrendingUp size={11} />
              {card.trend}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <CheckSquare size={16} className="text-blue-600" />
            My Tasks
          </h2>
          <div className="space-y-2">
            <p className="text-sm text-slate-400 text-center py-8">
              No tasks assigned yet
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <AlertCircle size={16} className="text-orange-600" />
            Recent Tickets
          </h2>
          <div className="space-y-2">
            <p className="text-sm text-slate-400 text-center py-8">
              No open tickets
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Clock size={16} className="text-green-600" />
          Today's Attendance
        </h2>
        <p className="text-sm text-slate-400 text-center py-8">
          No attendance records for today
        </p>
      </div>
    </div>
  );
}
