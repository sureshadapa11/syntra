"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, ShieldCheck, Users, X, Check } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Role {
  id: string; name: string; permissions: Record<string, boolean>;
  _count: { users: number };
}

const PERMISSION_KEYS = [
  { key: "manage_users", label: "Manage Users" },
  { key: "manage_projects", label: "Manage Projects" },
  { key: "manage_leaves", label: "Manage Leaves" },
  { key: "manage_tickets", label: "Manage Tickets" },
  { key: "manage_assets", label: "Manage Assets" },
  { key: "manage_announcements", label: "Manage Announcements" },
  { key: "manage_settings", label: "Manage Settings" },
  { key: "view_reports", label: "View Reports" },
];

export function RolesSettings() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Role | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", permissions: {} as Record<string, boolean> });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/roles").then((r) => r.json()).then((data) => { setRoles(data); setLoading(false); });
  }, []);

  function openAdd() {
    setAdding(true); setEditing(null);
    setForm({ name: "", permissions: Object.fromEntries(PERMISSION_KEYS.map((p) => [p.key, false])) });
    setError("");
  }

  function openEdit(role: Role) {
    setEditing(role); setAdding(false);
    setForm({ name: role.name, permissions: { ...role.permissions } });
    setError("");
  }

  function cancel() { setAdding(false); setEditing(null); setError(""); }

  async function save() {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true); setError("");

    const url = editing ? `/api/roles/${editing.id}` : "/api/roles";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, permissions: form.permissions }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }

    if (editing) setRoles((prev) => prev.map((r) => r.id === data.id ? data : r));
    else setRoles((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    cancel();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/roles/${deleteTarget.id}`, { method: "DELETE" });
    const data = await res.json();
    setDeleting(false);
    if (!res.ok) { alert(data.error); return; }
    setRoles((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Roles & Permissions</h2>
          <p className="text-sm text-slate-500 mt-0.5">Define what each role can do across the platform</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={13} /> Add Role
        </button>
      </div>

      {/* Edit/Add form */}
      {(adding || editing) && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
          <p className="text-sm font-semibold text-blue-800">{adding ? "New Role" : `Edit "${editing?.name}"`}</p>
          <input
            autoFocus
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Role name (e.g. Manager)"
            className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Permissions</p>
            <div className="grid grid-cols-2 gap-2">
              {PERMISSION_KEYS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!form.permissions[key]}
                    onChange={(e) => setForm({ ...form, permissions: { ...form.permissions, [key]: e.target.checked } })}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
              <Check size={12} /> {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={cancel} className="flex items-center gap-1.5 text-slate-600 px-3 py-1.5 rounded-lg text-sm hover:bg-white transition-colors">
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Roles list */}
      <div className="space-y-3">
        {roles.map((role) => {
          const activePerms = PERMISSION_KEYS.filter(({ key }) => role.permissions?.[key]);
          const isEditing = editing?.id === role.id;
          return (
            <div key={role.id} className={`bg-white border rounded-xl p-4 ${isEditing ? "border-blue-300" : "border-slate-200"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
                    <ShieldCheck size={16} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 capitalize">{role.name}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Users size={10} /> {role._count.users} user{role._count.users !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(role)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => setDeleteTarget(role)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {activePerms.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {activePerms.map(({ key, label }) => (
                    <span key={key} className="text-xs bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                      {label}
                    </span>
                  ))}
                </div>
              )}
              {activePerms.length === 0 && (
                <p className="text-xs text-slate-400 mt-2">No specific permissions — read-only access</p>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Role"
        description={`Delete "${deleteTarget?.name}"? Users with this role must be reassigned first.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
