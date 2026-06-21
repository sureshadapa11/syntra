"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";

interface CreateProjectFormProps {
  onSuccess: (project: any) => void;
  onCancel: () => void;
}

const typeOptions = [
  { value: "scrum", label: "Scrum — sprints, backlog, velocity" },
  { value: "kanban", label: "Kanban — continuous flow" },
];

export function CreateProjectForm({ onSuccess, onCancel }: CreateProjectFormProps) {
  const [form, setForm] = useState({ name: "", key: "", description: "", type: "scrum" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(field: string, value: string) {
    setForm((f) => {
      const updated = { ...f, [field]: value };
      // Auto-generate key from name
      if (field === "name" && !f.key) {
        updated.key = value
          .split(/\s+/)
          .filter(Boolean)
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 4);
      }
      return updated;
    });
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.key) { setError("Name and key are required"); return; }
    if (!/^[A-Z0-9]{2,6}$/.test(form.key.toUpperCase())) {
      setError("Key must be 2–6 uppercase letters/numbers");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, key: form.key.toUpperCase() }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "Failed to create project"); return; }
    onSuccess(data);
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <Input
        id="proj-name"
        label="Project Name"
        placeholder="e.g. Syntra Web App"
        value={form.name}
        onChange={(e) => set("name", e.target.value)}
      />

      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            id="proj-key"
            label="Project Key"
            placeholder="e.g. SWA"
            value={form.key}
            onChange={(e) => set("key", e.target.value.toUpperCase())}
          />
          <p className="text-xs text-slate-400 mt-1">Short unique identifier for tasks (e.g. SWA-1)</p>
        </div>
        <div className="w-52">
          <Select
            id="proj-type"
            label="Project Type"
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
            options={typeOptions}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="proj-desc" className="text-sm font-medium text-slate-700">
          Description <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="proj-desc"
          rows={3}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="What is this project about?"
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
        <Button type="submit" loading={loading}>Create Project</Button>
      </div>
    </form>
  );
}
