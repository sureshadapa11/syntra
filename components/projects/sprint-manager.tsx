"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDate } from "@/lib/utils";
import { Plus, Play, CheckSquare, Trash2, ChevronDown } from "lucide-react";

interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  _count: { tasks: number };
}

interface SprintManagerProps {
  projectId: string;
  sprints: Sprint[];
  activeSprint: Sprint | null;
  selectedSprintId: string | null;
  onSprintSelect: (id: string | null) => void;
  onSprintsChange: (sprints: Sprint[]) => void;
}

export function SprintManager({
  projectId, sprints, activeSprint, selectedSprintId, onSprintSelect, onSprintsChange,
}: SprintManagerProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ name: "", goal: "", startDate: "", endDate: "" });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    const res = await fetch(`/api/projects/${projectId}/sprints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const sprint = await res.json();
    onSprintsChange([...sprints, sprint]);
    setForm({ name: "", goal: "", startDate: "", endDate: "" });
    setShowCreate(false);
    setCreating(false);
  }

  async function handleStatusChange(sprint: Sprint, newStatus: string) {
    const res = await fetch(`/api/projects/${projectId}/sprints/${sprint.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const updated = await res.json();
    onSprintsChange(sprints.map((s) => s.id === sprint.id ? { ...s, ...updated } : s));
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    await fetch(`/api/projects/${projectId}/sprints/${deleteId}`, { method: "DELETE" });
    onSprintsChange(sprints.filter((s) => s.id !== deleteId));
    if (selectedSprintId === deleteId) onSprintSelect(null);
    setDeleteId(null);
    setDeleting(false);
  }

  const sprintCount = sprints.length;

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Board/Kanban: no sprint filter shown in sprint manager, just sprint selector */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
          <button
            onClick={() => onSprintSelect(null)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              selectedSprintId === null ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            All Active
          </button>
          {sprints.filter((s) => s.status !== "completed").map((sprint) => (
            <button
              key={sprint.id}
              onClick={() => onSprintSelect(sprint.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                selectedSprintId === sprint.id ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {sprint.name}
              {sprint.status === "active" && (
                <span className="ml-1.5 w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
              )}
            </button>
          ))}
        </div>

        {/* Sprint actions */}
        {selectedSprintId && (() => {
          const sprint = sprints.find((s) => s.id === selectedSprintId);
          if (!sprint) return null;
          return (
            <div className="flex items-center gap-1.5">
              {sprint.status === "planning" && (
                <Button size="sm" variant="outline" onClick={() => handleStatusChange(sprint, "active")}>
                  <Play size={12} /> Start Sprint
                </Button>
              )}
              {sprint.status === "active" && (
                <Button size="sm" variant="outline" onClick={() => handleStatusChange(sprint, "completed")}>
                  <CheckSquare size={12} /> Complete
                </Button>
              )}
              <button
                onClick={() => setDeleteId(sprint.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })()}

        <Button size="sm" variant="outline" onClick={() => setShowCreate(true)}>
          <Plus size={13} /> New Sprint
        </Button>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Sprint" size="md">
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <Input
            id="sprint-name"
            label="Sprint Name"
            placeholder={`Sprint ${sprintCount + 1}`}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Goal <span className="text-slate-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={form.goal}
              onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
              placeholder="What should this sprint achieve?"
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input id="sprint-start" label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
            <Input id="sprint-end" label="End Date" type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" loading={creating}>Create Sprint</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Sprint"
        description="Unfinished tasks will move to the backlog. This cannot be undone."
        confirmLabel="Delete Sprint"
        loading={deleting}
      />
    </>
  );
}
