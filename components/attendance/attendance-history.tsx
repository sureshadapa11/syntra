"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Clock, MapPin, Home, Wifi } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AttendanceRecord {
  id: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  type: string;
  notes: string | null;
}

const typeConfig: Record<string, { label: string; icon: any; variant: "success" | "info" | "purple" }> = {
  office: { label: "Office", icon: MapPin, variant: "success" },
  wfh: { label: "WFH", icon: Home, variant: "info" },
  remote: { label: "Remote", icon: Wifi, variant: "purple" },
};

function calcDuration(clockIn: string, clockOut: string) {
  const ms = new Date(clockOut).getTime() - new Date(clockIn).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function formatTimeOnly(str: string) {
  return new Date(str).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function AttendanceHistory() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/attendance?month=${monthKey}&limit=31`)
      .then((r) => r.json())
      .then((data) => { setRecords(data); setLoading(false); });
  }, [monthKey]);

  function prevMonth() { setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1)); }
  function nextMonth() { setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1)); }

  const totalHours = records.reduce((sum, r) => {
    if (!r.clockIn || !r.clockOut) return sum;
    return sum + (new Date(r.clockOut).getTime() - new Date(r.clockIn).getTime()) / 3600000;
  }, 0);

  const avgHours = records.length ? (totalHours / records.length).toFixed(1) : "0";

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h2 className="font-semibold text-slate-900">Attendance History</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {records.length} days · {totalHours.toFixed(0)}h total · {avgHours}h avg/day
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ChevronLeft size={15} />
          </button>
          <span className="text-sm font-medium text-slate-700 px-2">
            {currentMonth.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Clock In</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Clock Out</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Duration</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                  No attendance records for this month
                </td>
              </tr>
            ) : (
              records.map((record) => {
                const config = typeConfig[record.type] ?? typeConfig.office;
                const Icon = config.icon;
                return (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {new Date(record.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={config.variant}>
                        <Icon size={10} className="mr-1" />
                        {config.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-slate-700 font-medium tabular-nums">
                        {record.clockIn ? formatTimeOnly(record.clockIn) : <span className="text-slate-300">—</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-slate-700 font-medium tabular-nums">
                        {record.clockOut ? formatTimeOnly(record.clockOut) : (
                          record.clockIn ? <span className="text-green-600 text-xs font-semibold">Active</span> : <span className="text-slate-300">—</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-slate-600 tabular-nums flex items-center gap-1">
                        {record.clockIn && record.clockOut ? (
                          <><Clock size={11} className="text-slate-400" />{calcDuration(record.clockIn, record.clockOut)}</>
                        ) : record.clockIn ? (
                          <span className="text-green-600 text-xs">Ongoing</span>
                        ) : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400 max-w-xs truncate">
                      {record.notes ?? "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
