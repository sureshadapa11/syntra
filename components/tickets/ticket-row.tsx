"use client";

import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { Clock, AlertCircle, ArrowUp, Minus, ArrowDown, MessageSquare, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

interface Ticket {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  slaDeadline: string | null;
  resolvedAt: string | null;
  createdAt: string;
  raisedBy: { id: string; name: string; avatar: string | null; department: { name: string } | null };
  assignedTo: { id: string; name: string; avatar: string | null } | null;
  _count: { comments: number };
}

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  open: { label: "Open", color: "text-amber-700 bg-amber-50 border-amber-100", dot: "bg-amber-400" },
  "in-progress": { label: "In Progress", color: "text-blue-700 bg-blue-50 border-blue-100", dot: "bg-blue-500" },
  resolved: { label: "Resolved", color: "text-green-700 bg-green-50 border-green-100", dot: "bg-green-500" },
  closed: { label: "Closed", color: "text-slate-600 bg-slate-100 border-slate-200", dot: "bg-slate-400" },
};

const priorityConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  critical: { icon: AlertCircle, color: "text-red-600", label: "Critical" },
  high: { icon: ArrowUp, color: "text-orange-500", label: "High" },
  medium: { icon: Minus, color: "text-amber-500", label: "Medium" },
  low: { icon: ArrowDown, color: "text-slate-400", label: "Low" },
};

const categoryColors: Record<string, string> = {
  IT: "bg-blue-50 text-blue-700",
  HR: "bg-purple-50 text-purple-700",
  Finance: "bg-green-50 text-green-700",
  Admin: "bg-orange-50 text-orange-700",
  Other: "bg-slate-100 text-slate-600",
};

function SlaChip({ deadline, status }: { deadline: string | null; status: string }) {
  if (!deadline || status === "resolved" || status === "closed") return null;
  const diff = new Date(deadline).getTime() - Date.now();
  const overdue = diff < 0;
  const hoursLeft = Math.abs(Math.floor(diff / 3600000));

  if (!overdue && hoursLeft > 8) return null; // don't clutter for healthy SLAs

  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded border ${
      overdue ? "bg-red-50 text-red-700 border-red-100" : "bg-amber-50 text-amber-700 border-amber-100"
    }`}>
      {overdue ? `SLA +${hoursLeft}h` : `${hoursLeft}h left`}
    </span>
  );
}

interface TicketRowProps {
  ticket: Ticket;
  onClick: () => void;
}

export function TicketRow({ ticket, onClick }: TicketRowProps) {
  const status = statusConfig[ticket.status] ?? statusConfig.open;
  const priority = priorityConfig[ticket.priority] ?? priorityConfig.medium;
  const PriorityIcon = priority.icon;

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-100 last:border-0"
    >
      {/* Status dot */}
      <div className={`w-2 h-2 rounded-full shrink-0 ${status.dot}`} />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-xs font-mono text-slate-400">#{ticket.id.slice(-6).toUpperCase()}</span>
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${categoryColors[ticket.category] ?? "bg-slate-100 text-slate-600"}`}>
            {ticket.category}
          </span>
          <SlaChip deadline={ticket.slaDeadline} status={ticket.status} />
        </div>
        <p className="text-sm font-medium text-slate-900 truncate">{ticket.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-400">{ticket.raisedBy.name}</span>
          {ticket.raisedBy.department && (
            <span className="text-xs text-slate-300">· {ticket.raisedBy.department.name}</span>
          )}
          <span className="text-xs text-slate-300">· {formatDate(ticket.createdAt)}</span>
        </div>
      </div>

      {/* Priority */}
      <div className={`flex items-center gap-1 text-xs font-medium shrink-0 ${priority.color}`}>
        <PriorityIcon size={13} />
        <span className="hidden sm:block">{priority.label}</span>
      </div>

      {/* Status badge */}
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${status.color}`}>
        {status.label}
      </span>

      {/* Comments + assignee */}
      <div className="flex items-center gap-2 shrink-0">
        {ticket._count.comments > 0 && (
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <MessageSquare size={12} />
            {ticket._count.comments}
          </span>
        )}
        {ticket.assignedTo ? (
          <Avatar name={ticket.assignedTo.name} src={ticket.assignedTo.avatar} size="xs" />
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-200 shrink-0" title="Unassigned" />
        )}
      </div>
    </div>
  );
}
