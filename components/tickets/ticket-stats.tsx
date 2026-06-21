"use client";

import { Clock, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface Ticket {
  status: string;
  priority: string;
  slaDeadline: string | null;
}

interface TicketStatsProps {
  tickets: Ticket[];
}

export function TicketStats({ tickets }: TicketStatsProps) {
  const open = tickets.filter((t) => t.status === "open").length;
  const inProgress = tickets.filter((t) => t.status === "in-progress").length;
  const resolved = tickets.filter((t) => t.status === "resolved").length;
  const breached = tickets.filter(
    (t) => t.slaDeadline && new Date(t.slaDeadline) < new Date() && t.status !== "resolved" && t.status !== "closed"
  ).length;
  const critical = tickets.filter((t) => t.priority === "critical" && t.status !== "resolved" && t.status !== "closed").length;

  const stats = [
    { label: "Open", value: open, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { label: "In Progress", value: inProgress, icon: RefreshCw, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { label: "Resolved", value: resolved, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
    { label: "SLA Breached", value: breached, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className={`rounded-xl border ${stat.border} ${stat.bg} px-4 py-3 flex items-center gap-3`}>
            <div className={`p-2 rounded-lg bg-white/60`}>
              <Icon size={16} className={stat.color} />
            </div>
            <div>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
