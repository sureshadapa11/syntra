import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, statusColor } from "@/lib/utils";
import { Calendar, Plus } from "lucide-react";

export default async function LeavesPage() {
  const session = await auth();
  const [leaves, balance] = await Promise.all([
    prisma.leave.findMany({
      where: { userId: session!.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.leaveBalance.findFirst({
      where: { userId: session!.user.id, year: new Date().getFullYear() },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Leave Management</h1>
          <p className="text-slate-500 mt-1">Manage your time off</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} />
          Request Leave
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Annual Leave", used: balance?.annualUsed ?? 0, total: balance?.annualTotal ?? 20 },
          { label: "Sick Leave", used: balance?.sickUsed ?? 0, total: balance?.sickTotal ?? 10 },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {item.total - item.used}
              <span className="text-sm font-normal text-slate-400 ml-1">/ {item.total} days</span>
            </p>
            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${(item.used / item.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">{item.used} days used</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Calendar size={16} className="text-slate-500" />
          <h2 className="font-semibold text-slate-800">My Leave Requests</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {leaves.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-10">No leave requests yet</p>
          ) : (
            leaves.map((leave) => (
              <div key={leave.id} className="flex items-center gap-6 px-5 py-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800 capitalize">{leave.type} Leave</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDate(leave.startDate)} → {formatDate(leave.endDate)} · {leave.daysCount} day{leave.daysCount > 1 ? "s" : ""}
                  </p>
                  {leave.reason && (
                    <p className="text-xs text-slate-400 mt-0.5">{leave.reason}</p>
                  )}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColor(leave.status)}`}>
                  {leave.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
