"use client";

import { useState } from "react";
import { ClockWidget } from "@/components/attendance/clock-widget";
import { AttendanceCalendar } from "@/components/attendance/attendance-calendar";
import { AttendanceHistory } from "@/components/attendance/attendance-history";
import { TeamAttendance } from "@/components/attendance/team-attendance";
import { Clock, CalendarDays, Table2, Users } from "lucide-react";

type Tab = "my" | "team";

export default function AttendancePage() {
  const [tab, setTab] = useState<Tab>("my");
  const [view, setView] = useState<"calendar" | "table">("calendar");
  const [refreshKey, setRefreshKey] = useState(0);

  function handleClockAction() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Attendance</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track work hours and team presence</p>
        </div>

        {/* Tab toggle */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
          <button
            onClick={() => setTab("my")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === "my" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Clock size={14} /> My Attendance
          </button>
          <button
            onClick={() => setTab("team")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === "team" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Users size={14} /> Team View
          </button>
        </div>
      </div>

      {/* My Attendance Tab */}
      {tab === "my" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Clock widget */}
          <div className="lg:col-span-1">
            <ClockWidget onClockAction={handleClockAction} />
          </div>

          {/* Right: Calendar + History */}
          <div className="lg:col-span-2 space-y-5">
            {/* View toggle */}
            <div className="flex items-center gap-1 self-start bg-white border border-slate-200 rounded-lg p-1 w-fit">
              <button
                onClick={() => setView("calendar")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === "calendar" ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <CalendarDays size={14} /> Calendar
              </button>
              <button
                onClick={() => setView("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === "table" ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Table2 size={14} /> Table
              </button>
            </div>

            <div key={refreshKey}>
              {view === "calendar" ? <AttendanceCalendar /> : <AttendanceHistory />}
            </div>
          </div>
        </div>
      )}

      {/* Team Attendance Tab */}
      {tab === "team" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <TeamAttendance />
          </div>
          <div className="lg:col-span-1">
            <ClockWidget onClockAction={handleClockAction} />
          </div>
        </div>
      )}
    </div>
  );
}
