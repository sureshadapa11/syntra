"use client";

import { useState, useEffect } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  avatar: string | null;
  jobTitle: string | null;
  department: string | null;
  attendance: {
    clockIn: string | null;
    clockOut: string | null;
    type: string;
  } | null;
}

function getStatus(member: TeamMember) {
  if (!member.attendance) return "absent";
  if (member.attendance.clockIn && !member.attendance.clockOut) return "active";
  if (member.attendance.clockIn && member.attendance.clockOut) return "done";
  return "absent";
}

const statusConfig = {
  active: { label: "Working", variant: "success" as const, dot: "bg-green-500 animate-pulse" },
  done: { label: "Done", variant: "info" as const, dot: "bg-blue-500" },
  absent: { label: "Absent", variant: "default" as const, dot: "bg-slate-300" },
};

const typeLabel: Record<string, string> = { office: "Office", wfh: "WFH", remote: "Remote" };

export function TeamAttendance() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "absent">("all");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  async function fetchTeam() {
    setLoading(true);
    const res = await fetch("/api/attendance/team");
    const data = await res.json();
    setMembers(data);
    setLastUpdated(new Date());
    setLoading(false);
  }

  useEffect(() => { fetchTeam(); }, []);

  const filtered = members.filter((m) => {
    const matchSearch =
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.department ?? "").toLowerCase().includes(search.toLowerCase());
    const status = getStatus(m);
    const matchFilter =
      filter === "all" ||
      (filter === "active" && (status === "active" || status === "done")) ||
      (filter === "absent" && status === "absent");
    return matchSearch && matchFilter;
  });

  const activeCount = members.filter((m) => getStatus(m) === "active").length;
  const doneCount = members.filter((m) => getStatus(m) === "done").length;
  const absentCount = members.filter((m) => getStatus(m) === "absent").length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-slate-900">Team Attendance</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Last updated {lastUpdated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <button
            onClick={fetchTeam}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Summary pills */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {[
            { key: "all", label: `All (${members.length})` },
            { key: "active", label: `Present (${activeCount + doneCount})` },
            { key: "absent", label: `Absent (${absentCount})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === key
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <Search size={13} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search team members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent focus:outline-none text-slate-700 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Members list */}
      <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">No team members found</div>
        ) : (
          filtered.map((member) => {
            const status = getStatus(member);
            const { label, variant, dot } = statusConfig[status];
            return (
              <div key={member.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="relative">
                  <Avatar name={member.name} src={member.avatar} size="sm" />
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${dot}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{member.name}</p>
                  <p className="text-xs text-slate-400 truncate">{member.jobTitle ?? member.department ?? "—"}</p>
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <Badge variant={variant}>{label}</Badge>
                  {member.attendance?.clockIn && (
                    <div className="text-xs text-slate-400">
                      {new Date(member.attendance.clockIn).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      {member.attendance.clockOut && (
                        <> → {new Date(member.attendance.clockOut).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</>
                      )}
                    </div>
                  )}
                  {member.attendance?.type && (
                    <p className="text-xs text-slate-400">{typeLabel[member.attendance.type]}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer summary bar */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" /> {activeCount} working
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> {doneCount} done
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-300" /> {absentCount} absent
            </span>
          </div>
          <span>
            {Math.round(((activeCount + doneCount) / (members.length || 1)) * 100)}% attendance
          </span>
        </div>
      </div>
    </div>
  );
}
