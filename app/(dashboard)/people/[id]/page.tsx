import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  Mail, Phone, Building2, Users, CalendarDays, Briefcase,
  ArrowLeft, Pencil, Clock, CheckSquare, Package, Award
} from "lucide-react";

const statusVariant: Record<string, "success" | "warning" | "danger" | "default"> = {
  active: "success",
  inactive: "danger",
  "on-leave": "warning",
};

const roleVariant: Record<string, "info" | "purple" | "warning" | "danger" | "default"> = {
  admin: "danger", manager: "purple", developer: "info", hr: "warning", viewer: "default",
};

const taskStatusColor: Record<string, string> = {
  todo: "bg-slate-100 text-slate-600",
  "in-progress": "bg-blue-50 text-blue-700",
  review: "bg-purple-50 text-purple-700",
  done: "bg-green-50 text-green-700",
};

export default async function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
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
      attendance: { orderBy: { date: "desc" }, take: 7 },
      tasksAssigned: {
        where: { status: { not: "done" } },
        include: { project: { select: { name: true, key: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      assets: true,
    },
  });

  if (!user) notFound();

  const balance = user.leaveBalances[0];
  const skills = Array.isArray(user.skills) ? user.skills as string[] : [];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back */}
      <Link href="/people" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft size={15} /> Back to People
      </Link>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-600 to-blue-700" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <Avatar name={user.name} src={user.avatar} size="2xl" className="border-4 border-white shadow-md" />
            <Link
              href={`/people/${user.id}/edit`}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Pencil size={14} /> Edit Profile
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
              <p className="text-slate-500 mt-0.5">{user.jobTitle ?? "No title set"}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant={statusVariant[user.status] ?? "default"} className="capitalize">{user.status}</Badge>
                <Badge variant={roleVariant[user.role.name] ?? "default"} className="capitalize">{user.role.name}</Badge>
                <Badge variant="default" className="capitalize">{user.employmentType.replace("-", " ")}</Badge>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5 border-t border-slate-100">
            {[
              { icon: Mail, label: "Email", value: user.email, href: `mailto:${user.email}` },
              { icon: Phone, label: "Phone", value: user.phone ?? "Not set" },
              { icon: Building2, label: "Department", value: user.department?.name ?? "Not set" },
              { icon: CalendarDays, label: "Start Date", value: user.startDate ? formatDate(user.startDate) : "Not set" },
            ].map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Icon size={14} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">{label}</p>
                  {href ? (
                    <a href={href} className="text-sm font-medium text-blue-600 hover:underline">{value}</a>
                  ) : (
                    <p className="text-sm font-medium text-slate-800">{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="space-y-5">
          {/* Bio */}
          {user.bio && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-2">About</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{user.bio}</p>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Award size={14} /> Skills
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill: string) => (
                  <span key={skill} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Manager */}
          {user.manager && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Briefcase size={14} /> Reports To
              </h2>
              <Link href={`/people/${user.manager.id}`} className="flex items-center gap-3 hover:bg-slate-50 -mx-2 px-2 py-2 rounded-lg transition-colors">
                <Avatar name={user.manager.name} src={null} size="sm" />
                <div>
                  <p className="text-sm font-medium text-slate-800">{user.manager.name}</p>
                  <p className="text-xs text-slate-500">{user.manager.jobTitle ?? "Manager"}</p>
                </div>
              </Link>
            </div>
          )}

          {/* Direct Reports */}
          {user.directReports.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Users size={14} /> Direct Reports ({user.directReports.length})
              </h2>
              <div className="space-y-2">
                {user.directReports.map((report) => (
                  <Link key={report.id} href={`/people/${report.id}`} className="flex items-center gap-3 hover:bg-slate-50 -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                    <Avatar name={report.name} src={report.avatar} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{report.name}</p>
                      <p className="text-xs text-slate-500">{report.jobTitle ?? "—"}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Assets */}
          {user.assets.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Package size={14} /> Assets
              </h2>
              <div className="space-y-2">
                {user.assets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{asset.name}</span>
                    <span className="text-xs text-slate-400 capitalize">{asset.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Leave Balance */}
          {balance && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <CalendarDays size={14} /> Leave Balance {new Date().getFullYear()}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Annual Leave", used: balance.annualUsed, total: balance.annualTotal, color: "bg-blue-500" },
                  { label: "Sick Leave", used: balance.sickUsed, total: balance.sickTotal, color: "bg-orange-400" },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                    <p className="text-xl font-bold text-slate-900">
                      {item.total - item.used}
                      <span className="text-sm font-normal text-slate-400 ml-1">/ {item.total}</span>
                    </p>
                    <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${(item.used / item.total) * 100}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{item.used} days used</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Tasks */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <CheckSquare size={14} /> Active Tasks
            </h2>
            {user.tasksAssigned.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No active tasks</p>
            ) : (
              <div className="space-y-2">
                {user.tasksAssigned.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${taskStatusColor[task.status]}`}>
                      {task.status.replace("-", " ")}
                    </span>
                    <span className="text-sm text-slate-700 flex-1 truncate">{task.title}</span>
                    <span className="text-xs text-slate-400 shrink-0">{task.project.key}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Attendance */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Clock size={14} /> Recent Attendance
            </h2>
            {user.attendance.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No attendance records</p>
            ) : (
              <div className="space-y-2">
                {user.attendance.map((record) => {
                  const hours = record.clockIn && record.clockOut
                    ? ((record.clockOut.getTime() - record.clockIn.getTime()) / 3600000).toFixed(1)
                    : null;
                  return (
                    <div key={record.id} className="flex items-center gap-4 text-sm">
                      <span className="text-slate-500 w-24 shrink-0">{formatDate(record.date)}</span>
                      <span className="text-slate-700">
                        {record.clockIn ? record.clockIn.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"}
                        {" → "}
                        {record.clockOut ? record.clockOut.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "Active"}
                      </span>
                      {hours && <span className="text-xs text-slate-400">{hours}h</span>}
                      <Badge variant={record.type === "office" ? "success" : record.type === "wfh" ? "info" : "default"} className="capitalize ml-auto">{record.type}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
