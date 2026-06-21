"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { RaiseTicketForm } from "@/components/tickets/raise-ticket-form";
import {
  Clock, CalendarPlus, Ticket, Plus, ArrowRight,
} from "lucide-react";

export function QuickActions() {
  const router = useRouter();
  const [showTicket, setShowTicket] = useState(false);

  const actions = [
    {
      icon: Clock,
      label: "Attendance",
      desc: "Clock in / out",
      color: "text-green-600",
      bg: "bg-green-50 hover:bg-green-100 border-green-100",
      onClick: () => router.push("/attendance"),
    },
    {
      icon: CalendarPlus,
      label: "Request Leave",
      desc: "Book time off",
      color: "text-blue-600",
      bg: "bg-blue-50 hover:bg-blue-100 border-blue-100",
      onClick: () => router.push("/leaves"),
    },
    {
      icon: Ticket,
      label: "Raise Ticket",
      desc: "Get IT / HR help",
      color: "text-orange-600",
      bg: "bg-orange-50 hover:bg-orange-100 border-orange-100",
      onClick: () => setShowTicket(true),
    },
    {
      icon: Plus,
      label: "New Task",
      desc: "Add to a project",
      color: "text-purple-600",
      bg: "bg-purple-50 hover:bg-purple-100 border-purple-100",
      onClick: () => router.push("/projects"),
    },
  ];

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                onClick={a.onClick}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-colors text-left ${a.bg}`}
              >
                <div className="shrink-0">
                  <Icon size={16} className={a.color} />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold ${a.color}`}>{a.label}</p>
                  <p className="text-xs text-slate-500 truncate">{a.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Modal open={showTicket} onClose={() => setShowTicket(false)} title="Raise a Ticket" size="md">
        <RaiseTicketForm
          onSuccess={() => { setShowTicket(false); router.push("/tickets"); }}
          onCancel={() => setShowTicket(false)}
        />
      </Modal>
    </>
  );
}
