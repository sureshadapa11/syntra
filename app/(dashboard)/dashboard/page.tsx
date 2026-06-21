import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { formatDate } from "@/lib/utils";
import {
  Users, FolderKanban, Ticket, Calendar, TrendingUp,
  CheckSquare, AlertCircle, ArrowUp, Minus, ArrowDown,
  Clock, CheckCircle2, BookOpen, Bug, GitBranch,
  Megaphone, CalendarDays, ArrowRight, Plane, Stethoscope,
} from "lucide-react";

function greeting(name: string) {
  const h = new Date().getHours();
  const time = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  return `Good ${time}, ${name.split(" ")[0]}`;
}

function todayLabel() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

const PRIORITY_ICON: Record<string, React.ElementType> = {
  critical: AlertCircle, high: ArrowUp, medium: Minus, low: ArrowDown,
};
const PRIORITY_COLOR: Record<string, string> = {
  critical: "text-red-600", high: "text-orange-500", medium: "text-amber-500", low: "text-slate-400",
};
const TASK_TYPE_ICON: Record<string, React.ElementType> = {
  story: BookOpen, task: CheckSquare, bug: Bug, subtask: GitBranch,
};
const TASK_TYPE_COLOR: Record<string, string> = {
  story: "text-green-600", task: "text-blue-600", bug: "text-red-600", subtask: "text-slate-400",
};
const TASK_STATUS_STYLE: Record<string, string> = {
  "todo": "bg-slate-100 text-slate-600",
  "in-progress": "bg-blue-100 text-blue-700",
  "review": "bg-amber-100 text-amber-700",
  "done": "bg-green-100 text-green-700",
};
const TICKET_STATUS_COLOR: Record<string, string> = {
  "open": "bg-amber-100 text-amber-700",
  "in-progress": "bg-blue-100 text-blue-700",
  "resolved": "bg-green-100 text-green-700",
  "closed": "bg-slate-100 text-slate-500",
};
const ATT_TYPE_COLOR: Record<string, string> = {
  office: "bg-green-500", wfh: "bg-blue-500", remote: "bg-purple-500",
};
const ATT_TYPE_LABEL: Record<string, string> = {
  office: "Office", wfh: "WFH", remote: "Remote",
};
const PRIORITY_WEIGHT: Record<string, number> = {
  critical: 0, high: 1, medium: 2, low: 3,
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = session.user.id;
  const isAdmin = ["admin", "manager", "hr"].includes(session.user.role ?? "");
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);
  const nextWeek = new Date(todayStart.getTime() + 7 * 86400000);
  const year = now.getFullYear();

  const [
    totalUsers,
    newUsersThisMonth,
    activeProjects,
    openTickets,
    slaBreachedTickets,
    pendingLeaves,
    myTasks,
    myOpenTickets,
    teamToday,
    upcomingLeaves,
    recentAnnouncements,
    myLeaveBalance,
    tasksDoneThisWeek,
  ] = await Promise.all([
    prisma.user.count({ where: { status: "active" } }),
    prisma.user.count({ where: { status: "active", createdAt: { gte: startOfMonth } } }),
    prisma.project.count({ where: { status: "active" } }),
    prisma.ticket.count({
      where: { status: "open", ...(isAdmin ? {} : { raisedById: userId }) },
    }),
    isAdmin
      ? prisma.ticket.count({ where: { status: { in: ["open", "in-progress"] }, slaDeadline: { lt: now } } })
      : Promise.resolve(0),
    prisma.leave.count({
      where: { status: "pending", ...(isAdmin ? {} : { userId }) },
    }),
    prisma.task.findMany({
      where: { assigneeId: userId, status: { not: "done" } },
      include: {
        project: { select: { id: true, name: true, key: true } },
        epic: { select: { name: true, color: true } },
      },
      take: 10,
    }),
    prisma.ticket.findMany({
      where: { raisedById: userId, status: { in: ["open", "in-progress"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.attendance.findMany({
      where: { date: { gte: todayStart, lt: todayEnd } },
      include: {
        user: { select: { id: true, name: true, avatar: true, jobTitle: true } },
      },
      orderBy: { clockIn: "asc" },
    }),
    prisma.leave.findMany({
      where: { status: "approved", startDate: { gte: todayStart, lte: nextWeek } },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { startDate: "asc" },
      take: 6,
    }),
    prisma.announcement.findMany({
      include: {
        createdBy: { select: { id: true, name: true, avatar: true } },
        department: { select: { name: true } },
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 3,
    }),
    prisma.leaveBalance.findFirst({ where: { userId, year } }),
    prisma.task.count({
      where: {
        assigneeId: userId,
        status: "done",
        updatedAt: { gte: new Date(todayStart.getTime() - 7 * 86400000) },
      },
    }),
  ]);

  myTasks.sort((a, b) => (PRIORITY_WEIGHT[a.priority] ?? 2) - (PRIORITY_WEIGHT[b.priority] ?? 2));

  const workingCount = teamToday.filter((a) => !a.clockOut).length;
  const inOfficeCount = teamToday.filter((a) => !a.clockOut && a.type === "office").length;
  const annualLeft = myLeaveBalance ? myLeaveBalance.annualTotal - myLeaveBalance.annualUsed : null;
  const sickLeft = myLeaveBalance ? myLeaveBalance.sickTotal - myLeaveBalance.sickUsed : null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Greeting */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{greeting(session.user.name ?? "there")} 👋</h1>
          <p className="text-sm text-slate-500 mt-0.5">{todayLabel()}</p>
        </div>
        {myLeaveBalance && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-xl px-3 py-1.5">
              <Plane size={12} className="text-blue-600" />
              <span className="text-xs font-semibold text-blue-700">{annualLeft} annual days left</span>
            </div>
            <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-100 rounded-xl px-3 py-1.5">
              <Stethoscope size={12} className="text-orange-600" />
              <span className="text-xs font-semibold text-orange-700">{sickLeft} sick days left</span>
            </div>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            href: "/people",
            label: "Active Employees",
            value: totalUsers,
            icon: Users,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
            sub: newUsersThisMonth > 0
              ? { text: `+${newUsersThisMonth} this month`, color: "text-green-500", Icon: TrendingUp }
              : { text: "No new hires this month", color: "text-slate-400", Icon: Minus },
          },
          {
            href: "/projects",
            label: "Active Projects",
            value: activeProjects,
            icon: FolderKanban,
            iconBg: "bg-purple-50",
            iconColor: "text-purple-600",
            sub: { text: `${myTasks.length} task${myTasks.length !== 1 ? "s" : ""} assigned to you`, color: "text-slate-400", Icon: CheckSquare },
          },
          {
            href: "/tickets",
            label: isAdmin ? "Open Tickets" : "My Open Tickets",
            value: openTickets,
            icon: Ticket,
            iconBg: "bg-orange-50",
            iconColor: "text-orange-600",
            sub: slaBreachedTickets > 0
              ? { text: `${slaBreachedTickets} SLA breached`, color: "text-red-500", Icon: AlertCircle }
              : { text: "All within SLA", color: "text-green-500", Icon: CheckCircle2 },
          },
          {
            href: "/leaves",
            label: isAdmin ? "Pending Approvals" : "My Pending Leaves",
            value: pendingLeaves,
            icon: Calendar,
            iconBg: "bg-green-50",
            iconColor: "text-green-600",
            sub: pendingLeaves > 0
              ? { text: "Awaiting approval", color: "text-amber-500", Icon: AlertCircle }
              : { text: "Nothing pending", color: "text-green-500", Icon: CheckCircle2 },
          },
        ].map((card) => {
          const Icon = card.icon;
          const SubIcon = card.sub.Icon;
          return (
            <Link key={card.label} href={card.href} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <div className={`p-2 rounded-lg ${card.iconBg}`}>
                  <Icon size={16} className={card.iconColor} />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">{card.value}</p>
              <p className={`text-xs mt-1.5 flex items-center gap-1 ${card.sub.color}`}>
                <SubIcon size={11} />
                {card.sub.text}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* My Tasks — spans 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <CheckSquare size={15} className="text-blue-600" />
                My Tasks
                {myTasks.length > 0 && (
                  <span className="text-xs font-bold bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center">
                    {myTasks.length}
                  </span>
                )}
              </h2>
              {tasksDoneThisWeek > 0 && (
                <p className="text-xs text-slate-400 mt-0.5">
                  <TrendingUp size={10} className="inline text-green-500 mr-1" />
                  {tasksDoneThisWeek} completed this week
                </p>
              )}
            </div>
            <Link href="/projects" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              Projects <ArrowRight size={12} />
            </Link>
          </div>

          {myTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-slate-400">
              <CheckSquare size={36} className="mb-2 opacity-25" />
              <p className="text-sm font-medium text-slate-600">You're all caught up!</p>
              <p className="text-xs mt-1">No tasks assigned to you right now</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {myTasks.map((task) => {
                const PIcon = PRIORITY_ICON[task.priority] ?? Minus;
                const TIcon = TASK_TYPE_ICON[task.type] ?? CheckSquare;
                const overdue = task.dueDate && new Date(task.dueDate) < now;

                return (
                  <Link key={task.id} href={`/projects/${task.project.id}/board`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group"
                  >
                    <TIcon size={14} className={TASK_TYPE_COLOR[task.type] ?? "text-slate-400"} />
                    <PIcon size={13} className={PRIORITY_COLOR[task.priority] ?? "text-slate-400"} />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-slate-400 font-mono">{task.project.key}</span>
                        {task.epic && (
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: task.epic.color + "22", color: task.epic.color }}>
                            {task.epic.name}
                          </span>
                        )}
                        {overdue && (
                          <span className="text-xs font-semibold text-red-600 flex items-center gap-0.5">
                            <AlertCircle size={10} /> Overdue
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {task.dueDate && !overdue && (
                        <span className="text-xs text-slate-400 hidden sm:block">{formatDate(task.dueDate)}</span>
                      )}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${TASK_STATUS_STYLE[task.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {task.status.replace("-", " ")}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Quick Actions + My Tickets */}
        <div className="space-y-4">
          <QuickActions />

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Ticket size={14} className="text-orange-500" /> My Tickets
              </h2>
              <Link href="/tickets" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                View all <ArrowRight size={11} />
              </Link>
            </div>
            {myOpenTickets.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 size={24} className="mx-auto text-green-400 mb-1 opacity-70" />
                <p className="text-xs text-slate-400">No open tickets</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {myOpenTickets.map((t) => (
                  <Link key={t.id} href="/tickets"
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                    <span className="text-xs font-mono text-slate-400 shrink-0">#{t.id.slice(-5).toUpperCase()}</span>
                    <p className="text-xs text-slate-700 flex-1 truncate">{t.title}</p>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full capitalize shrink-0 ${TICKET_STATUS_COLOR[t.status] ?? ""}`}>
                      {t.status.replace("-", " ")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Team Today */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <Clock size={15} className="text-green-600" /> Team Today
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {workingCount} working · {inOfficeCount} in office
              </p>
            </div>
            <Link href="/attendance" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              Full view <ArrowRight size={11} />
            </Link>
          </div>

          {teamToday.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-1 text-slate-400">
              <Clock size={28} className="opacity-25" />
              <p className="text-xs">No check-ins yet today</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {teamToday.slice(0, 7).map((att) => (
                <div key={att.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="relative shrink-0">
                    <Avatar name={att.user.name} src={att.user.avatar} size="sm" />
                    {!att.clockOut && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{att.user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{att.user.jobTitle ?? ""}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full text-white shrink-0 ${ATT_TYPE_COLOR[att.type] ?? "bg-slate-400"}`}>
                    {ATT_TYPE_LABEL[att.type] ?? att.type}
                  </span>
                </div>
              ))}
              {teamToday.length > 7 && (
                <Link href="/attendance" className="block px-4 py-2 text-xs text-blue-600 hover:bg-slate-50 text-center transition-colors">
                  +{teamToday.length - 7} more →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Upcoming Leaves */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <CalendarDays size={15} className="text-blue-600" /> Upcoming Leaves
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Next 7 days</p>
            </div>
            <Link href="/leaves" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              Calendar <ArrowRight size={11} />
            </Link>
          </div>

          {upcomingLeaves.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-1 text-slate-400">
              <CalendarDays size={28} className="opacity-25" />
              <p className="text-xs">No leaves this week</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {upcomingLeaves.map((leave) => {
                const startDate = new Date(leave.startDate);
                const isToday = startDate.toDateString() === now.toDateString();
                const isTomorrow = startDate.toDateString() === new Date(todayStart.getTime() + 86400000).toDateString();
                const label = isToday ? "Today" : isTomorrow ? "Tomorrow" : formatDate(leave.startDate);

                return (
                  <div key={leave.id} className="flex items-center gap-3 px-4 py-2.5">
                    <Avatar name={leave.user.name} src={leave.user.avatar} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{leave.user.name}</p>
                      <p className="text-xs text-slate-400">
                        {label}
                        {leave.startDate !== leave.endDate && ` → ${formatDate(leave.endDate)}`}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full capitalize shrink-0">
                      {leave.type === "wfh" ? "WFH" : leave.type}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Announcements */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Megaphone size={15} className="text-purple-600" /> Announcements
            </h2>
            <Link href="/announcements" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>

          {recentAnnouncements.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-1 text-slate-400">
              <Megaphone size={28} className="opacity-25" />
              <p className="text-xs">No announcements yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentAnnouncements.map((ann) => {
                const ageDays = Math.floor((Date.now() - new Date(ann.createdAt).getTime()) / 86400000);
                const ageLabel = ageDays === 0 ? "Today" : ageDays === 1 ? "Yesterday" : `${ageDays}d ago`;

                return (
                  <Link key={ann.id} href="/announcements" className="block px-4 py-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-1.5 mb-0.5">
                      {ann.pinned && <span className="text-xs shrink-0">📌</span>}
                      <p className="text-sm font-semibold text-slate-900 line-clamp-1">{ann.title}</p>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{ann.content}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Avatar name={ann.createdBy.name} src={ann.createdBy.avatar} size="xs" />
                      <span className="text-xs text-slate-400">{ann.createdBy.name}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{ageLabel}</span>
                      {ann.department && (
                        <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                          {ann.department.name}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
