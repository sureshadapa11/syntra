"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AlertCircle, Trash2 } from "lucide-react";

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "on-hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
];

const typeOptions = [
  { value: "scrum", label: "Scrum" },
  { value: "kanban", label: "Kanban" },
];

export default function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [projectId, setProjectId] = useState("");
  const [form, setForm] = useState({ name: "", key: "", description: "", status: "active", type: "scrum" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    params.then(async ({ id }) => {
      setProjectId(id);
      const proj = await fetch(`/api/projects/${id}`).then((r) => r.json());
      setForm({
        name: proj.name,
        key: proj.key,
        description: proj.description ?? "",
        status: proj.status,
        type: proj.type,
      });
      setLoading(false);
    });
  }, []);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
    setSuccess(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setSuccess(true); }
    else { const d = await res.json(); setError(d.error ?? "Save failed"); }
  }

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    router.push("/projects");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Project Settings</h2>
        <p className="text-sm text-slate-500 mt-0.5">Update project details and configuration.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <Input id="s-name" label="Project Name" value={form.name} onChange={(e) => set("name", e.target.value)} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input id="s-key" label="Project Key" value={form.key} disabled />
            <p className="text-xs text-slate-400 mt-1">Key cannot be changed after creation.</p>
          </div>
          <Select id="s-type" label="Type" value={form.type} onChange={(e) => set("type", e.target.value)} options={typeOptions} />
        </div>

        <Select id="s-status" label="Status" value={form.status} onChange={(e) => set("status", e.target.value)} options={statusOptions} />

        <div className="flex flex-col gap-1">
          <label htmlFor="s-desc" className="text-sm font-medium text-slate-700">Description</label>
          <textarea
            id="s-desc"
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2.5 rounded-lg border border-red-100">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-green-700 bg-green-50 px-3 py-2.5 rounded-lg border border-green-100">
            Settings saved successfully.
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button type="submit" loading={saving}>Save Changes</Button>
        </div>
      </form>

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-red-100 p-6">
        <h3 className="font-semibold text-red-700 mb-1">Danger Zone</h3>
        <p className="text-sm text-slate-500 mb-4">Archiving removes the project from the active list. Tasks and data are preserved.</p>
        <Button variant="danger" onClick={() => setShowDelete(true)}>
          <Trash2 size={14} /> Archive Project
        </Button>
      </div>

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Archive Project"
        description={`Archive "${form.name}"? It will be removed from the active projects list. This can be undone by an admin.`}
        confirmLabel="Archive"
        loading={deleting}
      />
    </div>
  );
}
