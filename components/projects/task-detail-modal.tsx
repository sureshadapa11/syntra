"use client";

import { useState, useEffect, useCallback } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  X, BookOpen, CheckSquare, Bug, GitBranch, AlertCircle, ArrowUp, ArrowDown, Minus,
  MessageSquare, Send, Trash2, Layers, Calendar, Zap,
} from "lucide-react";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null };
}

interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  priority: string;
  storyPoints: number | null;
  dueDate: string | null;
  createdAt: string;
  assignee: { id: string; name: string; avatar: string | null } | null;
  reporter: { id: string; name: string; avatar: string | null } | null;
  epic: { id: string; name: string; color: string } | null;
  sprint: { id: string; name: string; status: string } | null;
  project: { id: string; name: string; key: string };
  subtasks: Array<{ id: string; title: string; status: string; assignee: { name: string; avatar: string | null } | null }>;
  comments: Comment[];
}

interface Member { id: string; name: string; }

interface TaskDetailModalProps {
  taskId: string;
  members: Member[];
  onClose: () => void;
  onUpdate: (task: any) => void;
  onDelete: (id: string) => void;
}

const statusOptions = [
  { value: "todo", label: "To Do" },
  { value: "in-progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
];

const priorityOptions = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const typeIcons: Record<string, React.ElementType> = {
  story: BookOpen, task: CheckSquare, bug: Bug, subtask: GitBranch,
};
const typeColors: Record<string, string> = {
  story: "text-green-600", task: "text-blue-600", bug: "text-red-600", subtask: "text-slate-500",
};
const priorityIcons: Record<string, React.ElementType> = {
  critical: AlertCircle, high: ArrowUp, medium: Minus, low: ArrowDown,
};
const priorityColors: Record<string, string> = {
  critical: "text-red-600", high: "text-orange-500", medium: "text-amber-500", low: "text-slate-400",
};

const statusVariant: Record<string, any> = {
  todo: "default", "in-progress": "info", review: "warning", done: "success",
};

export function TaskDetailModal({ taskId, members, onClose, onUpdate, onDelete }: TaskDetailModalProps) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [editTitle, setEditTitle] = useState(false);
  const [titleVal, setTitleVal] = useState("");
  const [editDesc, setEditDesc] = useState(false);
  const [descVal, setDescVal] = useState("");

  const fetchTask = useCallback(async () => {
    const res = await fetch(`/api/tasks/${taskId}`);
    const data = await res.json();
    setTask(data);
    setTitleVal(data.title);
    setDescVal(data.description ?? "");
    setLoading(false);
  }, [taskId]);

  useEffect(() => { fetchTask(); }, [fetchTask]);

  async function updateField(field: string, value: any) {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    const updated = await res.json();
    setTask((t) => t ? { ...t, ...updated } : t);
    onUpdate(updated);
  }

  async function handleTitleSave() {
    if (!titleVal.trim()) return;
    await updateField("title", titleVal);
    setEditTitle(false);
  }

  async function handleDescSave() {
    await updateField("description", descVal);
    setEditDesc(false);
  }

  async function postComment() {
    if (!comment.trim()) return;
    setPosting(true);
    const res = await fetch(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: comment }),
    });
    const newComment = await res.json();
    setTask((t) => t ? { ...t, comments: [...t.comments, newComment] } : t);
    setComment("");
    setPosting(false);
  }

  async function handleDelete() {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    onDelete(taskId);
    onClose();
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!task) return null;

  const TypeIcon = typeIcons[task.type] ?? CheckSquare;
  const PriorityIcon = priorityIcons[task.priority] ?? Minus;
  const memberOptions = [{ value: "", label: "Unassigned" }, ...members.map((m) => ({ value: m.id, label: m.name }))];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl h-full bg-white shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <TypeIcon size={16} className={typeColors[task.type]} />
            <span className="text-xs font-mono text-slate-500 font-medium">
              {task.project.key}-{task.id.slice(-4).toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
              title="Delete task"
            >
              <Trash2 size={15} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Title */}
          {editTitle ? (
            <div className="space-y-2">
              <input
                autoFocus
                value={titleVal}
                onChange={(e) => setTitleVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleTitleSave(); if (e.key === "Escape") setEditTitle(false); }}
                className="w-full text-xl font-bold text-slate-900 border border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleTitleSave}>Save</Button>
                <Button size="sm" variant="outline" onClick={() => { setEditTitle(false); setTitleVal(task.title); }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <h1
              className="text-xl font-bold text-slate-900 cursor-text hover:bg-slate-50 rounded-lg px-2 -mx-2 py-1 transition-colors"
              onClick={() => setEditTitle(true)}
            >
              {task.title}
            </h1>
          )}

          {/* Status + Priority row */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant={statusVariant[task.status] ?? "default"} className="capitalize">
              {task.status.replace("-", " ")}
            </Badge>
            <div className="flex items-center gap-1 text-sm">
              <PriorityIcon size={14} className={priorityColors[task.priority]} />
              <span className="text-slate-600 capitalize">{task.priority}</span>
            </div>
            {task.epic && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-md"
                style={{ backgroundColor: task.epic.color + "22", color: task.epic.color }}
              >
                {task.epic.name}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Left column: editable fields */}
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Status</p>
                <Select
                  id="td-status"
                  value={task.status}
                  onChange={(e) => updateField("status", e.target.value)}
                  options={statusOptions}
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Priority</p>
                <Select
                  id="td-priority"
                  value={task.priority}
                  onChange={(e) => updateField("priority", e.target.value)}
                  options={priorityOptions}
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Assignee</p>
                <Select
                  id="td-assignee"
                  value={task.assignee?.id ?? ""}
                  onChange={(e) => updateField("assigneeId", e.target.value || null)}
                  options={memberOptions}
                />
              </div>
            </div>

            {/* Right column: meta */}
            <div className="space-y-4">
              {task.reporter && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Reporter</p>
                  <div className="flex items-center gap-2">
                    <Avatar name={task.reporter.name} src={task.reporter.avatar} size="xs" />
                    <span className="text-sm text-slate-700">{task.reporter.name}</span>
                  </div>
                </div>
              )}
              {task.sprint && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Sprint</p>
                  <p className="text-sm text-slate-700">{task.sprint.name}</p>
                </div>
              )}
              {task.storyPoints !== null && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                    <Zap size={11} className="inline mr-1" />Story Points
                  </p>
                  <p className="text-sm font-bold text-slate-700">{task.storyPoints}</p>
                </div>
              )}
              {task.dueDate && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                    <Calendar size={11} className="inline mr-1" />Due Date
                  </p>
                  <p className={`text-sm font-medium ${new Date(task.dueDate) < new Date() && task.status !== "done" ? "text-red-600" : "text-slate-700"}`}>
                    {formatDate(task.dueDate)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Created</p>
                <p className="text-xs text-slate-500">{formatDateTime(task.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Description</p>
            {editDesc ? (
              <div className="space-y-2">
                <textarea
                  autoFocus
                  rows={5}
                  value={descVal}
                  onChange={(e) => setDescVal(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleDescSave}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditDesc(false); setDescVal(task.description ?? ""); }}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div
                className="text-sm text-slate-600 cursor-text hover:bg-slate-50 rounded-lg p-2 -m-2 min-h-[40px] transition-colors"
                onClick={() => setEditDesc(true)}
              >
                {task.description || <span className="text-slate-400 italic">Click to add description…</span>}
              </div>
            )}
          </div>

          {/* Subtasks */}
          {task.subtasks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                <Layers size={11} className="inline mr-1" />Subtasks ({task.subtasks.length})
              </p>
              <div className="space-y-1.5">
                {task.subtasks.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                    <input
                      type="checkbox"
                      checked={sub.status === "done"}
                      onChange={() => {}}
                      className="rounded"
                    />
                    <span className={`text-sm flex-1 ${sub.status === "done" ? "line-through text-slate-400" : "text-slate-700"}`}>
                      {sub.title}
                    </span>
                    {sub.assignee && <Avatar name={sub.assignee.name} src={sub.assignee.avatar} size="xs" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              <MessageSquare size={11} className="inline mr-1" />
              Comments ({task.comments.length})
            </p>

            <div className="space-y-4 mb-4">
              {task.comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar name={c.user.name} src={c.user.avatar} size="sm" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-800">{c.user.name}</span>
                      <span className="text-xs text-slate-400">{formatDateTime(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                      {c.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <textarea
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) postComment(); }}
                  placeholder="Add a comment… (Ctrl+Enter to post)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
        </div>
      </div>
    </div>
  );
}
