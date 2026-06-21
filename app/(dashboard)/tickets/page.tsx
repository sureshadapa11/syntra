"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { TicketRow } from "@/components/tickets/ticket-row";
import { TicketDetail } from "@/components/tickets/ticket-detail";
import { TicketStats } from "@/components/tickets/ticket-stats";
import { RaiseTicketForm } from "@/components/tickets/raise-ticket-form";
import { Modal } from "@/components/ui/modal";
import { Ticket, Plus, Search, Filter } from "lucide-react";

interface TicketItem {
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

interface Agent { id: string; name: string; avatar: string | null; }

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const CATEGORY_FILTERS = [
  { value: "", label: "All Categories" },
  { value: "IT", label: "IT" },
  { value: "HR", label: "HR" },
  { value: "Finance", label: "Finance" },
  { value: "Admin", label: "Admin" },
  { value: "Other", label: "Other" },
];

const PRIORITY_FILTERS = [
  { value: "", label: "All Priorities" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const AGENT_ROLES = ["admin", "manager", "hr", "it"];

export default function TicketsPage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<"mine" | "all" | "assigned">("mine");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showRaise, setShowRaise] = useState(false);

  const isAgent = AGENT_ROLES.includes(session?.user?.role ?? "");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ scope });
    if (filterStatus) params.set("status", filterStatus);
    if (filterCategory) params.set("category", filterCategory);
    if (filterPriority) params.set("priority", filterPriority);
    if (search) params.set("search", search);

    const res = await fetch(`/api/tickets?${params}`);
    setTickets(await res.json());
    setLoading(false);
  }, [scope, filterStatus, filterCategory, filterPriority, search]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  useEffect(() => {
    if (isAgent) {
      fetch("/api/users?status=active")
        .then((r) => r.json())
        .then((users) => setAgents(users.map((u: any) => ({ id: u.id, name: u.name, avatar: u.avatar }))));
    }
  }, [isAgent]);

  // Default scope for agents
  useEffect(() => {
    if (isAgent) setScope("all");
  }, [isAgent]);

  function handleTicketCreated(ticket: TicketItem) {
    setTickets((prev) => [ticket, ...prev]);
    setShowRaise(false);
    setSelectedId(ticket.id);
  }

  function handleTicketUpdate(updated: any) {
    setTickets((prev) => prev.map((t) => t.id === updated.id ? { ...t, ...updated } : t));
  }

  function handleTicketDelete(id: string) {
    setTickets((prev) => prev.filter((t) => t.id !== id));
    setSelectedId(null);
  }

  const openCount = tickets.filter((t) => t.status === "open").length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Service Desk
            {openCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-amber-500 text-white text-xs rounded-full font-bold align-middle">
                {openCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
            {isAgent && " · You are an agent"}
          </p>
        </div>
        <button
          onClick={() => setShowRaise(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={15} /> Raise Ticket
        </button>
      </div>

      {/* Stats (agents only) */}
      {isAgent && tickets.length > 0 && <TicketStats tickets={tickets} />}

      {/* Scope + Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {isAgent && (
          <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg">
            {(["all", "assigned", "mine"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                  scope === s ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {s === "all" ? "All Tickets" : s === "assigned" ? "Assigned to Me" : "Raised by Me"}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 flex-wrap ml-auto">
          {/* Status pills */}
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterStatus === f.value
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search + category/priority filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm bg-transparent focus:outline-none text-slate-700 flex-1 placeholder:text-slate-400"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-600 focus:outline-none bg-white"
        >
          {CATEGORY_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-600 focus:outline-none bg-white"
        >
          {PRIORITY_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      {/* Ticket list */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Ticket size={44} className="mb-3 opacity-30" />
            <p className="font-semibold text-slate-600">No tickets found</p>
            <p className="text-sm mt-1">
              {filterStatus || filterCategory || filterPriority || search
                ? "Try adjusting your filters"
                : "Raise a ticket to get help from your support team"}
            </p>
            {!filterStatus && !filterCategory && !filterPriority && !search && (
              <button
                onClick={() => setShowRaise(true)}
                className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus size={14} /> Raise Ticket
              </button>
            )}
          </div>
        ) : (
          tickets.map((ticket) => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              onClick={() => setSelectedId(ticket.id)}
            />
          ))
        )}
      </div>

      {/* Detail panel */}
      {selectedId && session && (
        <TicketDetail
          ticketId={selectedId}
          currentUserId={session.user.id}
          isAgent={isAgent}
          agents={agents}
          onClose={() => setSelectedId(null)}
          onUpdate={handleTicketUpdate}
          onDelete={handleTicketDelete}
        />
      )}

      {/* Raise ticket modal */}
      <Modal open={showRaise} onClose={() => setShowRaise(false)} title="Raise a Ticket" size="md">
        <RaiseTicketForm onSuccess={handleTicketCreated} onCancel={() => setShowRaise(false)} />
      </Modal>
    </div>
  );
}
