"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, Users, Layers, X, Check } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Team {
  id: string; name: string; leadId: string | null;
  department: { name: string };
  _count: { users: number };
}
interface Department {
  id: string; name: string; description: string | null; headId: string | null;
  _count: { users: number; teams: number };
  teams?: Team[];
}

type Mode = "dept-add" | "dept-edit" | "team-add" | "team-edit" | null;

export function DepartmentsSettings() {
  const [depts, setDepts] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>(null);
  const [target, setTarget] = useState<{ dept?: Department; team?: Team; deptId?: string } | null>(null);
  const [form, setForm] = useState({ name: "", description: "", deptId: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ type: "dept" | "team"; id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([fetch("/api/departments").then((r) => r.json()), fetch("/api/teams").then((r) => r.json())]).then(
      ([d, t]) => { setDepts(d); setTeams(t); setLoading(false); }
    );
  }, []);

  function openDeptAdd() {
    setMode("dept-add");
    setTarget(null);
    setForm({ name: "", description: "", deptId: "" });
    setError("");
  }

  function openDeptEdit(dept: Department) {
    setMode("dept-edit");
    setTarget({ dept });
    setForm({ name: dept.name, description: dept.description ?? "", deptId: "" });
    setError("");
  }

  function openTeamAdd(deptId: string) {
    setMode("team-add");
    setTarget({ deptId });
    setForm({ name: "", description: "", deptId });
    setError("");
  }

  function openTeamEdit(team: Team) {
    setMode("team-edit");
    setTarget({ team });
    setForm({ name: team.name, description: "", deptId: "" });
    setError("");
  }

  function cancel() { setMode(null); setTarget(null); setError(""); }

  async function save() {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError("");

    let url = ""; let method = "POST"; let body: Record<string, unknown> = {};

    if (mode === "dept-add") {
      url = "/api/departments";
      body = { name: form.name, description: form.description };
    } else if (mode === "dept-edit" && target?.dept) {
      url = `/api/departments/${target.dept.id}`;
      method = "PUT";
      body = { name: form.name, description: form.description };
    } else if (mode === "team-add") {
      url = "/api/teams";
      body = { name: form.name, departmentId: target?.deptId };
    } else if (mode === "team-edit" && target?.team) {
      url = `/api/teams/${target.team.id}`;
      method = "PUT";
      body = { name: form.name };
    }

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }

    if (mode === "dept-add") setDepts((prev) => [...prev, { ...data, teams: [] }].sort((a, b) => a.name.localeCompare(b.name)));
    else if (mode === "dept-edit") setDepts((prev) => prev.map((d) => d.id === data.id ? { ...d, ...data } : d));
    else if (mode === "team-add") setTeams((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    else if (mode === "team-edit") setTeams((prev) => prev.map((t) => t.id === data.id ? { ...t, ...data } : t));

    cancel();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const url = deleteTarget.type === "dept" ? `/api/departments/${deleteTarget.id}` : `/api/teams/${deleteTarget.id}`;
    const res = await fetch(url, { method: "DELETE" });
    const data = await res.json();
    setDeleting(false);
    if (!res.ok) { alert(data.error); return; }
    if (deleteTarget.type === "dept") setDepts((prev) => prev.filter((d) => d.id !== deleteTarget.id));
    else setTeams((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  const deptTeams = (deptId: string) => teams.filter((t) => t.department.name === depts.find((d) => d.id === deptId)?.name);

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Departments & Teams</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage your organisation's structure</p>
        </div>
        <button
          onClick={openDeptAdd}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={13} /> Add Department
        </button>
      </div>

      {/* Inline form */}
      {mode && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-blue-800">
            {mode === "dept-add" ? "New Department" : mode === "dept-edit" ? "Edit Department" : mode === "team-add" ? "New Team" : "Edit Team"}
          </p>
          <input
            autoFocus
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
            placeholder="Name"
            className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          {(mode === "dept-add" || mode === "dept-edit") && (
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description (optional)"
              className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          )}
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

      {/* Departments list */}
      {depts.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Layers size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-slate-600">No departments yet</p>
          <p className="text-sm mt-1">Add a department to organise your teams</p>
        </div>
      ) : (
        <div className="space-y-2">
          {depts.map((dept) => {
            const isExpanded = expanded.has(dept.id);
            const dTeams = deptTeams(dept.id);
            return (
              <div key={dept.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                {/* Department row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => setExpanded((prev) => { const s = new Set(prev); s.has(dept.id) ? s.delete(dept.id) : s.add(dept.id); return s; })} className="text-slate-400 hover:text-slate-700">
                    {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{dept.name}</p>
                    {dept.description && <p className="text-xs text-slate-400 truncate">{dept.description}</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-xs text-slate-500"><Users size={12} />{dept._count.users}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500"><Layers size={12} />{dTeams.length} teams</span>
                    <button onClick={() => openDeptEdit(dept)} className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"><Pencil size={13} /></button>
                    <button onClick={() => setDeleteTarget({ type: "dept", id: dept.id, name: dept.name })} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>

                {/* Teams */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 space-y-2">
                    {dTeams.length === 0 ? (
                      <p className="text-xs text-slate-400">No teams in this department</p>
                    ) : (
                      dTeams.map((team) => (
                        <div key={team.id} className="flex items-center gap-3 bg-white border border-slate-100 rounded-lg px-3 py-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800">{team.name}</p>
                            <p className="text-xs text-slate-400">{team._count.users} member{team._count.users !== 1 ? "s" : ""}</p>
                          </div>
                          <button onClick={() => openTeamEdit(team)} className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"><Pencil size={12} /></button>
                          <button onClick={() => setDeleteTarget({ type: "team", id: team.id, name: team.name })} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={12} /></button>
                        </div>
                      ))
                    )}
                    <button
                      onClick={() => { openTeamAdd(dept.id); setExpanded((prev) => new Set(prev).add(dept.id)); }}
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
                    >
                      <Plus size={12} /> Add Team
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={`Delete ${deleteTarget?.type === "dept" ? "Department" : "Team"}`}
        description={`Delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
