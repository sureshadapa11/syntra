"use client";

import { useState, useEffect } from "react";
import { Avatar } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarLeave {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  user: { id: string; name: string; avatar: string | null };
}

const typeColors: Record<string, string> = {
  annual: "bg-blue-100 text-blue-700 border-blue-200",
  sick: "bg-orange-100 text-orange-700 border-orange-200",
  unpaid: "bg-slate-100 text-slate-600 border-slate-200",
  wfh: "bg-teal-100 text-teal-700 border-teal-200",
  maternity: "bg-pink-100 text-pink-700 border-pink-200",
  paternity: "bg-purple-100 text-purple-700 border-purple-200",
};

const typeLabels: Record<string, string> = {
  annual: "Annual", sick: "Sick", unpaid: "Unpaid",
  wfh: "WFH", maternity: "Maternity", paternity: "Paternity",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Mon=0
}

function dateKey(d: Date) {
  return d.toISOString().split("T")[0];
}

export function LeaveCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [leaves, setLeaves] = useState<CalendarLeave[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaves/calendar?year=${year}&month=${month + 1}`)
      .then((r) => r.json())
      .then((d) => { setLeaves(d); setLoading(false); });
  }, [year, month]);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Build map: dateStr -> leaves
  const dayMap: Record<string, CalendarLeave[]> = {};
  for (const leave of leaves) {
    const s = new Date(leave.startDate);
    const e = new Date(leave.endDate);
    const cur = new Date(s);
    while (cur <= e) {
      const key = dateKey(cur);
      if (!dayMap[key]) dayMap[key] = [];
      dayMap[key].push(leave);
      cur.setDate(cur.getDate() + 1);
    }
  }

  const totalCells = firstDay + daysInMonth;
  const rows = Math.ceil(totalCells / 7);
  const cells = Array.from({ length: rows * 7 }, (_, i) => {
    const dayNum = i - firstDay + 1;
    return dayNum >= 1 && dayNum <= daysInMonth ? dayNum : null;
  });

  const todayKey = dateKey(now);
  const monthName = new Date(year, month).toLocaleString("default", { month: "long" });

  // Legend: unique types in this month
  const typesInMonth = [...new Set(leaves.map((l) => l.type))];

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Team Leave Calendar</h2>
          <p className="text-xs text-slate-400 mt-0.5">{leaves.length} approved leaves this month</p>
        </div>
        <div className="flex items-center gap-3">
          {typesInMonth.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 flex-wrap">
              {typesInMonth.map((t) => (
                <span key={t} className={`text-xs font-medium px-2 py-0.5 rounded-md border ${typeColors[t] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                  {typeLabels[t] ?? t}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-slate-800 min-w-[120px] text-center">
              {monthName} {year}
            </span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-slate-100">
              {DAYS.map((d) => (
                <div key={d} className={`px-2 py-2 text-center text-xs font-semibold ${d === "Sat" || d === "Sun" ? "text-slate-400" : "text-slate-500"}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                if (!day) {
                  return <div key={i} className="min-h-[100px] bg-slate-50/50 border-b border-r border-slate-100" />;
                }
                const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayLeaves = dayMap[key] ?? [];
                const isToday = key === todayKey;
                const isWeekend = (i % 7) >= 5;

                return (
                  <div
                    key={i}
                    className={`min-h-[100px] border-b border-r border-slate-100 p-2 ${isWeekend ? "bg-slate-50/60" : "bg-white"}`}
                  >
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold mb-1.5 ${
                      isToday ? "bg-blue-600 text-white" : isWeekend ? "text-slate-400" : "text-slate-700"
                    }`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayLeaves.slice(0, 3).map((leave) => (
                        <div
                          key={leave.id + key}
                          className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border ${typeColors[leave.type] ?? "bg-slate-100 text-slate-600 border-slate-200"} truncate`}
                          title={`${leave.user.name} — ${typeLabels[leave.type] ?? leave.type}`}
                        >
                          <Avatar name={leave.user.name} src={leave.user.avatar} size="xs" />
                          <span className="truncate font-medium">{leave.user.name.split(" ")[0]}</span>
                        </div>
                      ))}
                      {dayLeaves.length > 3 && (
                        <div className="text-xs text-slate-400 pl-1">+{dayLeaves.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
