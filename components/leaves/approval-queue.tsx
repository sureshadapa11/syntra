"use client";

import { useState, useEffect, useCallback } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { CheckCircle, XCircle, Clock, Users, Search } from "lucide-react";

interface Leave {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string | null;
  status: string;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null; jobTitle: string | null; department: { name: string } | null };
}

const typeLabels: Record<string, string> = {
  annual: "Annual", sick: "Sick", unpaid: "Unpaid",
  wfh: "WFH", maternity: "Maternity", paternity: "Paternity",
};

const typeColors: Record<string, string> = {
  annual: "bg-blue-100 text-blue-700",
  sick: "bg-orange-100 text-orange-700",
  unpaid: "bg-slate-100 text-slate-600",
  wfh: "bg-teal-100 text-teal-700",
  maternity: "bg-pink-100 text-pink-700",
  paternity: "bg-purple-100 text-purple-700",
};

export function ApprovalQueue() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [search, setSearch] = useState("");

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/leaves?scope=all&status=${filterStatus}`);
    setLeaves(await res.json());
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  async function handleAction(id: string, action: "approve" | "reject") {
    setActionLoading(id + action);
    const res = await fetch(`/api/leaves/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      const updated = await res.json();
      setLeaves((prev) => prev.map((l) => l.id === id ? { ...l, status: updated.status } : l));
    }
    setActionLoading(null);
  }

  const filtered = leaves.filter((l) =>
    !search || l.user.name.toLowerCase().includes(search.toLowerCase())
  );

  const pending = leaves.filter((l) => l.status === "pending").length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              Team Leave Requests
              {pending > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 bg-amber-500 text-white text-xs rounded-full font-bold">{pending}</span>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{leaves.length} requests found</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {["pending", "approved", "rejected", "all"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s === "all" ? "" : s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                (s === "all" ? filterStatus === "" : filterStatus === s)
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <Search size={12} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs bg-transparent focus:outline-none text-slate-700 w-28 placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-slate-400">
            <Clock size={36} className="mb-3 opacity-40" />
            <p className="font-medium text-slate-600">No {filterStatus || ""} requests</p>
          </div>
        ) : (
          filtered.map((leave) => (
            <div key={leave.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
              <Avatar name={leave.user.name} src={leave.user.avatar} size="sm" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-900">{leave.user.name}</span>
                  <span className="text-xs text-slate-400">{leave.user.department?.name}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${typeColors[leave.type] ?? "bg-slate-100 text-slate-600"}`}>
                    {typeLabels[leave.type] ?? leave.type}
                  </span>
                  <span className="text-xs text-slate-600 font-medium">
                    {formatDate(leave.startDate)}{leave.startDate !== leave.endDate && ` → ${formatDate(leave.endDate)}`}
                  </span>
                  <span className="text-xs text-slate-400">({leave.daysCount} {leave.daysCount === 1 ? "day" : "days"})</span>
                </div>
                {leave.reason && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{leave.reason}</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant={leave.status === "approved" ? "success" : leave.status === "rejected" ? "danger" : leave.status === "pending" ? "warning" : "default"}
                  className="capitalize"
                >
                  {leave.status}
                </Badge>

                {leave.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleAction(leave.id, "approve")}
                      disabled={!!actionLoading}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <CheckCircle size={13} />
                      {actionLoading === leave.id + "approve" ? "..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleAction(leave.id, "reject")}
                      disabled={!!actionLoading}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <XCircle size={13} />
                      {actionLoading === leave.id + "reject" ? "..." : "Reject"}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
