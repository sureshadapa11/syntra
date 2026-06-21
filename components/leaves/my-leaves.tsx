"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LeaveRequestForm } from "./leave-request-form";
import { LeaveBalance } from "./leave-balance";
import { Plus, CalendarDays, XCircle, Filter } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Leave {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string | null;
  status: string;
  createdAt: string;
}

const statusVariant: Record<string, "warning" | "success" | "danger" | "default"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  cancelled: "default",
};

const typeLabels: Record<string, string> = {
  annual: "Annual Leave",
  sick: "Sick Leave",
  unpaid: "Unpaid Leave",
  wfh: "Work From Home",
  maternity: "Maternity",
  paternity: "Paternity",
};

const typeColors: Record<string, string> = {
  annual: "bg-blue-100 text-blue-700",
  sick: "bg-orange-100 text-orange-700",
  unpaid: "bg-slate-100 text-slate-600",
  wfh: "bg-teal-100 text-teal-700",
  maternity: "bg-pink-100 text-pink-700",
  paternity: "bg-purple-100 text-purple-700",
};

export function MyLeaves() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");

  async function fetchLeaves() {
    setLoading(true);
    const res = await fetch(`/api/leaves?scope=mine${filterStatus ? `&status=${filterStatus}` : ""}`);
    const data = await res.json();
    setLeaves(data);
    setLoading(false);
  }

  useEffect(() => { fetchLeaves(); }, [filterStatus]);

  function handleSuccess(leave: Leave) {
    setLeaves((prev) => [leave, ...prev]);
    setShowForm(false);
  }

  async function handleCancel() {
    if (!cancelId) return;
    setCancelling(true);
    await fetch(`/api/leaves/${cancelId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    setLeaves((prev) => prev.map((l) => l.id === cancelId ? { ...l, status: "cancelled" } : l));
    setCancelId(null);
    setCancelling(false);
  }

  const pending = leaves.filter((l) => l.status === "pending").length;
  const approved = leaves.filter((l) => l.status === "approved").length;

  return (
    <div className="space-y-5">
      <LeaveBalance />

      {/* My Requests Panel */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-900">My Leave Requests</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {pending > 0 ? `${pending} pending · ` : ""}{approved} approved this year
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus size={13} /> Request Leave
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : leaves.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <CalendarDays size={40} className="mb-3 opacity-40" />
            <p className="font-medium text-slate-600">No leave requests yet</p>
            <p className="text-sm mt-1">Plan time off by submitting a request</p>
            <Button className="mt-4" size="sm" onClick={() => setShowForm(true)}>
              <Plus size={13} /> Request Leave
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {leaves.map((leave) => (
              <div key={leave.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                {/* Type badge */}
                <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg ${typeColors[leave.type] ?? "bg-slate-100 text-slate-600"}`}>
                  {typeLabels[leave.type] ?? leave.type}
                </span>

                {/* Dates */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-800">
                      {formatDate(leave.startDate)}
                      {leave.startDate !== leave.endDate && <> → {formatDate(leave.endDate)}</>}
                    </span>
                    <span className="text-xs text-slate-400">
                      {leave.daysCount} {leave.daysCount === 1 ? "day" : "days"}
                    </span>
                  </div>
                  {leave.reason && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{leave.reason}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5">
                    Applied {formatDate(leave.createdAt)}
                  </p>
                </div>

                {/* Status + actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={statusVariant[leave.status] ?? "default"} className="capitalize">
                    {leave.status}
                  </Badge>
                  {leave.status === "pending" && (
                    <button
                      onClick={() => setCancelId(leave.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                      title="Cancel request"
                    >
                      <XCircle size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Request Leave" size="md">
        <LeaveRequestForm onSuccess={handleSuccess} onCancel={() => setShowForm(false)} />
      </Modal>

      <ConfirmDialog
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={handleCancel}
        title="Cancel Leave Request"
        description="Are you sure you want to cancel this leave request?"
        confirmLabel="Yes, Cancel It"
        loading={cancelling}
      />
    </div>
  );
}
