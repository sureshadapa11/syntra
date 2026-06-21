"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendanceRecord {
  id: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  type: string;
}

const typeColors: Record<string, string> = {
  office: "bg-green-500",
  wfh: "bg-blue-500",
  remote: "bg-purple-500",
};

const typeLabels: Record<string, string> = {
  office: "Office",
  wfh: "WFH",
  remote: "Remote",
};

function durationHours(record: AttendanceRecord) {
  if (!record.clockIn || !record.clockOut) return null;
  const ms = new Date(record.clockOut).getTime() - new Date(record.clockIn).getTime();
  return (ms / 3600000).toFixed(1);
}

export function AttendanceCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<AttendanceRecord | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/attendance?month=${monthKey}`)
      .then((r) => r.json())
      .then((data) => { setRecords(data); setLoading(false); });
  }, [monthKey]);

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startPad = firstDay === 0 ? 6 : firstDay - 1; // Make Monday first

  const recordByDate = records.reduce<Record<string, AttendanceRecord>>((acc, r) => {
    const key = new Date(r.date).toISOString().split("T")[0];
    acc[key] = r;
    return acc;
  }, {});

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)); }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)); }

  const today = new Date().toISOString().split("T")[0];

  // Stats for current month
  const presentDays = records.length;
  const officeDays = records.filter((r) => r.type === "office").length;
  const wfhDays = records.filter((r) => r.type === "wfh").length;
  const totalHours = records.reduce((sum, r) => {
    if (!r.clockIn || !r.clockOut) return sum;
    return sum + (new Date(r.clockOut).getTime() - new Date(r.clockIn).getTime()) / 3600000;
  }, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h2 className="font-semibold text-slate-900">
            {currentDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{presentDays} days logged</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-2.5 py-1 text-xs font-medium rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            Today
          </button>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
        {[
          { label: "Present", value: presentDays, color: "text-green-600" },
          { label: "Office", value: officeDays, color: "text-blue-600" },
          { label: "WFH", value: wfhDays, color: "text-purple-600" },
          { label: "Hours", value: `${totalHours.toFixed(0)}h`, color: "text-orange-600" },
        ].map((stat) => (
          <div key={stat.label} className="py-3 text-center">
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="p-4">
        {/* Day labels */}
        <div className="grid grid-cols-7 mb-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {/* Padding cells */}
            {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const record = recordByDate[dateKey];
              const isToday = dateKey === today;
              const isWeekend = new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6;
              const isFuture = dateKey > today;

              return (
                <button
                  key={day}
                  onClick={() => record && setSelected(selected?.id === record.id ? null : record)}
                  disabled={!record}
                  className={cn(
                    "relative aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all",
                    isToday && "ring-2 ring-blue-500 ring-offset-1",
                    record && "cursor-pointer hover:scale-105",
                    !record && isWeekend && "opacity-30",
                    !record && isFuture && "opacity-0 pointer-events-none",
                    !record && !isWeekend && !isFuture && "hover:bg-slate-50",
                    selected?.id === record?.id && "ring-2 ring-blue-400"
                  )}
                >
                  {record && (
                    <div className={cn("absolute inset-0.5 rounded-lg opacity-15", typeColors[record.type])} />
                  )}
                  <span className={cn(
                    "relative font-medium",
                    isToday ? "text-blue-600" : record ? "text-slate-800" : "text-slate-400"
                  )}>
                    {day}
                  </span>
                  {record && (
                    <div className={cn("relative w-1.5 h-1.5 rounded-full mt-0.5", typeColors[record.type])} />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-5 py-3 border-t border-slate-100">
        {Object.entries(typeLabels).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className={cn("w-2 h-2 rounded-full", typeColors[type])} />
            {label}
          </div>
        ))}
      </div>

      {/* Selected day detail */}
      {selected && (
        <div className="px-5 py-4 bg-blue-50 border-t border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-900">
                {new Date(selected.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <p className="text-xs text-blue-700 mt-0.5 capitalize">{typeLabels[selected.type]}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-800 font-medium">
                {selected.clockIn ? new Date(selected.clockIn).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"}
                {" → "}
                {selected.clockOut ? new Date(selected.clockOut).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "Active"}
              </p>
              {durationHours(selected) && (
                <p className="text-xs text-blue-600">{durationHours(selected)} hours</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
