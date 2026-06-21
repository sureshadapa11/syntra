"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, LogIn, LogOut, MapPin, Monitor, Home, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AttendanceRecord {
  id: string;
  clockIn: string | null;
  clockOut: string | null;
  type: string;
  date: string;
}

interface ClockWidgetProps {
  onClockAction?: () => void;
}

const workTypes = [
  { value: "office", label: "Office", icon: MapPin },
  { value: "wfh", label: "Work from Home", icon: Home },
  { value: "remote", label: "Remote", icon: Wifi },
];

function formatDuration(ms: number) {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function ClockWidget({ onClockAction }: ClockWidgetProps) {
  const [now, setNow] = useState(new Date());
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [workType, setWorkType] = useState("office");
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  // Tick every second
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchToday = useCallback(async () => {
    setFetching(true);
    const res = await fetch("/api/attendance/today");
    const data = await res.json();
    setRecord(data);
    setFetching(false);
  }, []);

  useEffect(() => { fetchToday(); }, [fetchToday]);

  async function handleClockIn() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/attendance/clock-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: workType }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); } else { setRecord(data); onClockAction?.(); }
    setLoading(false);
  }

  async function handleClockOut() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/attendance/clock-out", { method: "POST" });
    const data = await res.json();
    if (!res.ok) { setError(data.error); } else { setRecord(data); onClockAction?.(); }
    setLoading(false);
  }

  const isClockedIn = !!record?.clockIn && !record?.clockOut;
  const isClockedOut = !!record?.clockIn && !!record?.clockOut;

  const duration = record?.clockIn
    ? isClockedOut
      ? new Date(record.clockOut!).getTime() - new Date(record.clockIn).getTime()
      : now.getTime() - new Date(record.clockIn).getTime()
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header with live clock */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-6 py-5 text-white">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-400 uppercase tracking-wider">
            {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </span>
          <Clock size={14} className="text-slate-400" />
        </div>
        <div className="text-4xl font-bold tracking-tight tabular-nums">
          {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Status row */}
        {!fetching && (
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${isClockedIn ? "bg-green-500 animate-pulse" : isClockedOut ? "bg-blue-500" : "bg-slate-300"}`} />
            <span className="text-sm font-medium text-slate-700">
              {isClockedIn ? "Currently Working" : isClockedOut ? "Day Complete" : "Not Clocked In"}
            </span>
            {isClockedIn && (
              <span className="ml-auto text-sm font-semibold text-green-600 tabular-nums">{formatDuration(duration)}</span>
            )}
            {isClockedOut && (
              <span className="ml-auto text-sm font-semibold text-blue-600 tabular-nums">{formatDuration(duration)}</span>
            )}
          </div>
        )}

        {/* Time cards */}
        {record?.clockIn && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-xs text-green-600 mb-1 font-medium">Clocked In</p>
              <p className="text-lg font-bold text-green-700 tabular-nums">{formatTime(record.clockIn)}</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${record.clockOut ? "bg-blue-50" : "bg-slate-50"}`}>
              <p className={`text-xs mb-1 font-medium ${record.clockOut ? "text-blue-600" : "text-slate-400"}`}>Clocked Out</p>
              <p className={`text-lg font-bold tabular-nums ${record.clockOut ? "text-blue-700" : "text-slate-400"}`}>
                {record.clockOut ? formatTime(record.clockOut) : "—"}
              </p>
            </div>
          </div>
        )}

        {/* Work type selector — only show before clock-in */}
        {!record?.clockIn && (
          <div>
            <p className="text-xs text-slate-500 mb-2 font-medium">Where are you working today?</p>
            <div className="grid grid-cols-3 gap-2">
              {workTypes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setWorkType(value)}
                  className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-medium transition-all ${
                    workType === value
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Work type badge — after clock-in */}
        {record?.clockIn && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            {record.type === "office" && <><MapPin size={13} /> Office</>}
            {record.type === "wfh" && <><Home size={13} /> Work from Home</>}
            {record.type === "remote" && <><Wifi size={13} /> Remote</>}
          </div>
        )}

        {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        {/* Action button */}
        {!isClockedOut && (
          <Button
            onClick={isClockedIn ? handleClockOut : handleClockIn}
            loading={loading}
            className="w-full"
            variant={isClockedIn ? "danger" : "primary"}
            size="lg"
          >
            {isClockedIn ? <><LogOut size={16} /> Clock Out</> : <><LogIn size={16} /> Clock In</>}
          </Button>
        )}

        {isClockedOut && (
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-sm text-slate-600 font-medium">✓ Day complete — {formatDuration(duration)} logged</p>
          </div>
        )}
      </div>
    </div>
  );
}
