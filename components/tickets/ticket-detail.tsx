"use client";

import { useState, useEffect, useCallback } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  X, Send, Lock, AlertCircle, ArrowUp, Minus, ArrowDown, Clock, User,
  CheckCircle2, XCircle, RefreshCw, Tag, Trash2,
} from "lucide-react";

interface Comment {
  id: string;
  content: string;
  internal: boolean;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null; role: { name: string } | null };
}

interface TicketDetail {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  slaDeadline: string | null;
  resolvedAt: string | null;
  createdAt: string;
  raisedBy: { id: string; name: string; avatar: string | null; email: string; jobTitle: string | null; department: { name: string } | null };
  assignedTo: { id: string; name: string; avatar: string | null; jobTitle: string | null } | null;
  comments: Comment[];
}

interface Agent { id: string; name: string; avatar: string | null; }

interface TicketDetailProps {
  ticketId: string;
  currentUserId: string;
  isAgent: boolean;
  agents: Agent[];
  onClose: () => void;
  onUpdate: (ticket: any) => void;
  onDelete: (id: string) => void;
}

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const priorityOptions = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const categoryOptions = [
  { value: "IT", label: "IT" },
  { value: "HR", label: "HR" },
  { value: "Finance", label: "Finance" },
  { value: "Admin", label: "Admin" },
  { value: "Other", label: "Other" },
];

const statusConfig: Record<string, { variant: any; icon: React.ElementType; color: string }> = {
  open: { variant: "warning", icon: Clock, color: "text-amber-600" },
  "in-progress": { variant: "info", icon: RefreshCw, color: "text-blue-600" },
  resolved: { variant: "success", icon: CheckCircle2, color: "text-green-600" },
  closed: { variant: "default", icon: XCircle, color: "text-slate-500" },
};

const priorityConfig: Record<string, { icon: React.ElementType; color: string }> = {
  critical: { icon: AlertCircle, color: "text-red-600" },
  high: { icon: ArrowUp, color: "text-orange-500" },
  medium: { icon: Minus, color: "text-amber-500" },
  low: { icon: ArrowDown, color: "text-slate-400" },
};

function SlaIndicator({ deadline, status }: { deadline: string | null; status: string }) {
  if (!deadline || status === "resolved" || status === "closed") return null;
  const now = Date.now();
  const end = new Date(deadline).getTime();
  const diff = end - now;
  const overdue = diff < 0;
  const hoursLeft = Math.abs(Math.floor(diff / 3600000));
  const minsLeft = Math.abs(Math.floor((diff % 3600000) / 60000));

  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${
      overdue ? "bg-red-50 text-red-700 border-red-100" : diff < 3600000 ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-slate-50 text-slate-600 border-slate-100"
    }`}>
      <Clock size={12} />
      {overdue
        ? `SLA breached ${hoursLeft}h ${minsLeft}m ago`
        : diff < 3600000
        ? `SLA: ${minsLeft}m left`
        : `SLA: ${hoursLeft}h ${minsLeft}m left`}
    </div>
  );
}

export function TicketDetail({ ticketId, currentUserId, isAgent, agents, onClose, onUpdate, onDelete }: TicketDetailProps) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [internalNote, setInternalNote] = useState(false);
  const [posting, setPosting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchTicket = useCallback(async () => {
    const res = await fetch(`/api/tickets/${ticketId}`);
    const data = await res.json();
    setTicket(data);
    setLoading(false);
  }, [ticketId]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);

  async function updateField(field: string, value: any) {
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    const updated = await res.json();
    setTicket((t) => t ? { ...t, ...updated } : t);
    onUpdate(updated);
  }

  async function postComment() {
    if (!comment.trim()) return;
    setPosting(true);
    const res = await fetch(`/api/tickets/${ticketId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: comment, internal: internalNote }),
    });
    const newComment = await res.json();
    setTicket((t) => t ? {
      ...t,
      comments: [...t.comments, newComment],
      status: t.status === "open" && !internalNote && isAgent ? "in-progress" : t.status,
    } : t);
    setComment("");
    setPosting(false);
  }

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/tickets/${ticketId}`, { method: "DELETE" });
    onDelete(ticketId);
    onClose();
  }

  if (loading || !ticket) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statusCfg = statusConfig[ticket.status] ?? statusConfig.open;
  const StatusIcon = statusCfg.icon;
  const priCfg = priorityConfig[ticket.priority] ?? priorityConfig.medium;
  const PriorityIcon = priCfg.icon;
  const agentOptions = [{ value: "", label: "Unassigned" }, ...agents.map((a) => ({ value: a.id, label: a.name }))];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-400">#{ticket.id.slice(-6).toUpperCase()}</span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">{ticket.category}</span>
            </div>
            <h2 className="text-base font-semibold text-slate-900 leading-snug">{ticket.title}</h2>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {(isAgent || ticket.raisedBy.id === currentUserId) && (
              <button
                onClick={() => setShowDelete(true)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Status + SLA */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`flex items-center gap-1.5 text-sm font-medium ${statusCfg.color}`}>
                <StatusIcon size={15} />
                <span className="capitalize">{ticket.status.replace("-", " ")}</span>
              </div>
              <div className={`flex items-center gap-1.5 text-sm font-medium ${priCfg.color}`}>
                <PriorityIcon size={14} />
                <span className="capitalize">{ticket.priority}</span>
              </div>
              <SlaIndicator deadline={ticket.slaDeadline} status={ticket.status} />
            </div>

            {/* Fields grid */}
            <div className="grid grid-cols-2 gap-4">
              {isAgent && (
                <>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Status</p>
                    <Select id="tkt-status" value={ticket.status} onChange={(e) => updateField("status", e.target.value)} options={statusOptions} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Priority</p>
                    <Select id="tkt-priority" value={ticket.priority} onChange={(e) => updateField("priority", e.target.value)} options={priorityOptions} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Assigned To</p>
                    <Select id="tkt-assign" value={ticket.assignedTo?.id ?? ""} onChange={(e) => updateField("assignedToId", e.target.value || null)} options={agentOptions} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Category</p>
                    <Select id="tkt-cat" value={ticket.category} onChange={(e) => updateField("category", e.target.value)} options={categoryOptions} />
                  </div>
                </>
              )}

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Raised By</p>
                <div className="flex items-center gap-2">
                  <Avatar name={ticket.raisedBy.name} src={ticket.raisedBy.avatar} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{ticket.raisedBy.name}</p>
                    {ticket.raisedBy.department && <p className="text-xs text-slate-400">{ticket.raisedBy.department.name}</p>}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Created</p>
                <p className="text-sm text-slate-700">{formatDateTime(ticket.createdAt)}</p>
                {ticket.resolvedAt && (
                  <p className="text-xs text-green-600 mt-0.5">Resolved {formatDate(ticket.resolvedAt)}</p>
                )}
              </div>
            </div>

            {/* Description */}
            {ticket.description && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Description</p>
                <div className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-100 whitespace-pre-wrap">
                  {ticket.description}
                </div>
              </div>
            )}

            {/* Comments */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Activity ({ticket.comments.length})
              </p>

              <div className="space-y-4">
                {ticket.comments.map((c) => (
                  <div key={c.id} className={`flex gap-3 ${c.internal ? "opacity-80" : ""}`}>
                    <Avatar name={c.user.name} src={c.user.avatar} size="sm" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold text-slate-800">{c.user.name}</span>
                        {c.user.role && (
                          <span className="text-xs text-slate-400">{c.user.role.name}</span>
                        )}
                        {c.internal && (
                          <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                            <Lock size={10} /> Internal note
                          </span>
                        )}
                        <span className="text-xs text-slate-400">{formatDateTime(c.createdAt)}</span>
                      </div>
                      <div className={`text-sm text-slate-700 rounded-lg px-3 py-2 border whitespace-pre-wrap ${
                        c.internal ? "bg-amber-50 border-amber-100" : "bg-white border-slate-100"
                      }`}>
                        {c.content}
                      </div>
                    </div>
                  </div>
                ))}

                {ticket.comments.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">No activity yet. Be the first to reply.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reply box — pinned to bottom */}
        {ticket.status !== "closed" && (
          <div className="border-t border-slate-100 px-6 py-4 bg-white shrink-0">
            {isAgent && (
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => setInternalNote(false)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                    !internalNote ? "bg-blue-50 text-blue-700 border border-blue-100" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Send size={11} /> Reply to user
                </button>
                <button
                  onClick={() => setInternalNote(true)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                    internalNote ? "bg-amber-50 text-amber-700 border border-amber-100" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Lock size={11} /> Internal note
                </button>
              </div>
            )}
            <div className="flex gap-3">
              <div className="flex-1">
                <textarea
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) postComment(); }}
                  placeholder={internalNote ? "Internal note (only visible to agents)…" : "Write a reply… (Ctrl+Enter to send)"}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 resize-none ${
                    internalNote ? "border-amber-200 bg-amber-50 focus:ring-amber-300" : "border-slate-200 focus:ring-blue-500"
                  }`}
                />
              </div>
              <button
                onClick={postComment}
                disabled={!comment.trim() || posting}
                className="self-end p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Ticket"
        description="Delete this ticket permanently? All comments will be lost."
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
