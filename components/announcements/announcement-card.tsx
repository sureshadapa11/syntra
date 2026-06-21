"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AnnouncementForm } from "./announcement-form";
import { formatDateTime } from "@/lib/utils";
import { Pin, PinOff, Pencil, Trash2, Building2, Globe } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  createdBy: { id: string; name: string; avatar: string | null; jobTitle: string | null };
  department: { id: string; name: string } | null;
  departmentId: string | null;
}

interface Department { id: string; name: string; }

interface AnnouncementCardProps {
  ann: Announcement;
  departments: Department[];
  canManage: boolean;
  currentUserId: string;
  onUpdate: (updated: Announcement) => void;
  onDelete: (id: string) => void;
}

const DEPT_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
];

function deptColor(name: string) {
  let h = 0;
  for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h);
  return DEPT_COLORS[Math.abs(h) % DEPT_COLORS.length];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 6) return formatDateTime(dateStr);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "Just now";
}

export function AnnouncementCard({
  ann, departments, canManage, currentUserId, onUpdate, onDelete,
}: AnnouncementCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isOwner = ann.createdBy.id === currentUserId;
  const canEdit = canManage || isOwner;
  const isLong = ann.content.length > 300;
  const displayContent = isLong && !expanded ? ann.content.slice(0, 300).trimEnd() + "…" : ann.content;

  async function handlePin() {
    setPinLoading(true);
    const res = await fetch(`/api/announcements/${ann.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !ann.pinned }),
    });
    const updated = await res.json();
    onUpdate(updated);
    setPinLoading(false);
  }

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/announcements/${ann.id}`, { method: "DELETE" });
    onDelete(ann.id);
  }

  return (
    <>
      <div className={`bg-white rounded-2xl border transition-shadow hover:shadow-md ${
        ann.pinned ? "border-blue-200 shadow-sm shadow-blue-100/50" : "border-slate-200"
      }`}>
        {/* Pinned banner */}
        {ann.pinned && (
          <div className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 border-b border-blue-100 rounded-t-2xl">
            <Pin size={12} className="text-blue-600" />
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Pinned</span>
          </div>
        )}

        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={ann.createdBy.name} src={ann.createdBy.avatar} size="md" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-900">{ann.createdBy.name}</span>
                  {ann.createdBy.jobTitle && (
                    <span className="text-xs text-slate-400">{ann.createdBy.jobTitle}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-400">{timeAgo(ann.createdAt)}</span>
                  <span className="text-slate-300">·</span>
                  {ann.department ? (
                    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${deptColor(ann.department.name)}`}>
                      <Building2 size={10} />
                      {ann.department.name}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                      <Globe size={10} />
                      Company-wide
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            {canEdit && (
              <div className="flex items-center gap-1 shrink-0">
                {canManage && (
                  <button
                    onClick={handlePin}
                    disabled={pinLoading}
                    title={ann.pinned ? "Unpin" : "Pin"}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50"
                  >
                    {ann.pinned ? <PinOff size={15} /> : <Pin size={15} />}
                  </button>
                )}
                <button
                  onClick={() => setShowEdit(true)}
                  title="Edit"
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setShowDelete(true)}
                  title="Delete"
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">{ann.title}</h3>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{displayContent}</p>
          {isLong && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      </div>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Announcement" size="lg">
        <AnnouncementForm
          departments={departments}
          initial={{ id: ann.id, title: ann.title, content: ann.content, departmentId: ann.departmentId, pinned: ann.pinned }}
          onSuccess={(updated) => { onUpdate(updated); setShowEdit(false); }}
          onCancel={() => setShowEdit(false)}
        />
      </Modal>

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Announcement"
        description={`Delete "${ann.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </>
  );
}
