import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Clock, CheckCircle } from "lucide-react";

export default async function AttendancePage() {
  const session = await auth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayRecord = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId: session!.user.id,
        date: today,
      },
    },
  });

  const recent = await prisma.attendance.findMany({
    where: { userId: session!.user.id },
    orderBy: { date: "desc" },
    take: 10,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Attendance</h1>
        <p className="text-slate-500 mt-1">Track your work hours</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 mb-4">Today — {formatDate(new Date())}</h2>
        {todayRecord ? (
          <div className="flex items-center gap-8">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Clocked In</p>
              <p className="text-lg font-semibold text-slate-900">
                {todayRecord.clockIn ? formatDateTime(todayRecord.clockIn) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Clocked Out</p>
              <p className="text-lg font-semibold text-slate-900">
                {todayRecord.clockOut ? formatDateTime(todayRecord.clockOut) : "Still working"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-green-600">
              <CheckCircle size={16} />
              <span className="text-sm font-medium capitalize">{todayRecord.type}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <p className="text-slate-500 text-sm">You haven't clocked in yet today.</p>
            <form action="/api/attendance" method="POST">
              <button
                type="submit"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                <Clock size={16} />
                Clock In
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Recent Attendance</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {recent.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-10">No records yet</p>
          ) : (
            recent.map((record) => (
              <div key={record.id} className="flex items-center gap-6 px-5 py-3.5">
                <p className="text-sm font-medium text-slate-700 w-28">
                  {formatDate(record.date)}
                </p>
                <p className="text-sm text-slate-600 w-24">
                  {record.clockIn ? formatDateTime(record.clockIn).split(",")[1].trim() : "—"}
                </p>
                <p className="text-sm text-slate-600 w-24">
                  {record.clockOut ? formatDateTime(record.clockOut).split(",")[1].trim() : "—"}
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                  {record.type}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
