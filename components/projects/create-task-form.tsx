"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";

interface Member { id: string; name: string; }
interface Epic { id: string; name: string; color: string; }
interface Sprint { id: string; name: string; status: string; }

interface CreateTaskFormProps {
  projectId: string;
  sprintId?: string | null;
  members: Member[];
  epics: Epic[];
  sprints?: Sprint[];
  defaultStatus?: string;
  onSuccess: (task: any) => void;
  onCancel: () => void;
}

const typeOptions = [
  { value: "task", label: "Task" },
  { value: "story", label: "Story" },
  { value: "bug", label: "Bug" },
  { value: "subtask", label: "Subtask" },
];

const priorityOptions = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function CreateTaskForm({
  projectId, sprintId, members, epics, sprints, defaultStatus = "todo", onSuccess, onCancel,
}: CreateTaskFormProps) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "task",
    priority: "medium",
    assigneeId: "",
    epicId: "",
    storyPoints: "",
    dueDate: "",
    status: defaultStatus,
    sprintId: sprintId ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required"); return; }

    setLoading(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        sprintId: form.sprintId || null,
        epicId: form.epicId || null,
        title: form.title,
        description: form.description || null,
        type: form.type,
        priority: form.priority,
        status: form.status,
        assigneeId: form.assigneeId || null,
        storyPoints: form.storyPoints ? parseInt(form.storyPoints) : null,
        dueDate: form.dueDate || null,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "Failed to create task"); return; }
    onSuccess(data);
  }

  const memberOptions = [{ value: "", label: "Unassigned" }, ...members.map((m) => ({ value: m.id, label: m.name }))];
  const epicOptions = [{ value: "", label: "No epic" }, ...epics.map((ep) => ({ value: ep.id, label: ep.name }))];
  const sprintOptions = sprints
    ? [{ value: "", label: "Backlog" }, ...sprints.map((s) => ({ value: s.id, label: s.name }))]
    : undefined;

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <Input
        id="task-title"
        label="Title"
        placeholder="What needs to be done?"
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select id="task-type" label="Type" value={form.type} onChange={(e) => set("type", e.target.value)} options={typeOptions} />
        <Select id="task-priority" label="Priority" value={form.priority} onChange={(e) => set("priority", e.target.value)} options={priorityOptions} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select id="task-assignee" label="Assignee" value={form.assigneeId} onChange={(e) => set("assigneeId", e.target.value)} options={memberOptions} />
        {epicOptions.length > 1 && (
          <Select id="task-epic" label="Epic" value={form.epicId} onChange={(e) => set("epicId", e.target.value)} options={epicOptions} />
        )}
      </div>

      {sprintOptions && (
        <Select id="task-sprint" label="Sprint" value={form.sprintId} onChange={(e) => set("sprintId", e.target.value)} options={sprintOptions} />
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="task-points"
          label="Story Points"
          type="number"
          min="0"
          max="100"
          placeholder="e.g. 3"
          value={form.storyPoints}
          onChange={(e) => set("storyPoints", e.target.value)}
        />
        <Input
          id="task-due"
          label="Due Date"
          type="date"
          value={form.dueDate}
          onChange={(e) => set("dueDate", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="task-desc" className="text-sm font-medium text-slate-700">
          Description <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="task-desc"
          rows={3}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Add details..."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2.5 rounded-lg border border-red-100">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>Create Task</Button>
      </div>
    </form>
  );
}
