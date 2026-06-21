"use client";

import { useState, useEffect } from "react";
import { Calendar, Users, RefreshCw, Info } from "lucide-react";

interface Policy {
  year: number;
  annualTotal: number;
  sickTotal: number;
  totalEmployees: number;
  balancesExist: number;
}

export function LeavePolicySettings() {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [form, setForm] = useState({ annualTotal: 20, sickTotal: 10 });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings/leave-policy").then((r) => r.json()).then((data) => {
      setPolicy(data);
      setForm({ annualTotal: data.annualTotal, sickTotal: data.sickTotal });
    });
  }, []);

  async function handleSave() {
    setSaving(true); setMsg(null);
    const res = await fetch("/api/settings/leave-policy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setPolicy((prev) => prev ? { ...prev, annualTotal: form.annualTotal, sickTotal: form.sickTotal, balancesExist: prev.balancesExist + data.created } : prev);
      setMsg({ type: "success", text: `Updated ${data.updated} balance${data.updated !== 1 ? "s" : ""}${data.created > 0 ? `, created ${data.created} new` : ""}` });
    } else {
      setMsg({ type: "error", text: data.error ?? "Something went wrong" });
    }
  }

  if (!policy) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Leave Policy</h2>
        <p className="text-sm text-slate-500 mt-0.5">Set annual leave allocations for all employees</p>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-3">
          <Calendar size={16} className="text-blue-500 shrink-0" />
          <div>
            <p className="text-xs text-slate-400 font-medium">Year</p>
            <p className="text-sm font-bold text-slate-800">{policy.year}</p>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-3">
          <Users size={16} className="text-green-500 shrink-0" />
          <div>
            <p className="text-xs text-slate-400 font-medium">Active Employees</p>
            <p className="text-sm font-bold text-slate-800">{policy.totalEmployees}</p>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-3">
          <RefreshCw size={16} className="text-purple-500 shrink-0" />
          <div>
            <p className="text-xs text-slate-400 font-medium">Balances Set</p>
            <p className="text-sm font-bold text-slate-800">{policy.balancesExist}</p>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex gap-3">
        <Info size={15} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700">
          Saving will update leave balances for all active employees for {policy.year}. Used days are preserved — only the totals change.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 max-w-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Annual Leave (days)</label>
          <input
            type="number"
            min={0}
            max={365}
            value={form.annualTotal}
            onChange={(e) => setForm({ ...form, annualTotal: Number(e.target.value) })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Sick Leave (days)</label>
          <input
            type="number"
            min={0}
            max={365}
            value={form.sickTotal}
            onChange={(e) => setForm({ ...form, sickTotal: Number(e.target.value) })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>

      {/* Preview */}
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 max-w-sm">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Preview per employee</p>
        <div className="space-y-2">
          {[
            { label: "Annual leave", value: form.annualTotal, color: "bg-blue-500" },
            { label: "Sick leave", value: form.sickTotal, color: "bg-green-500" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-600">{item.label}</span>
                  <span className="text-xs font-semibold text-slate-800">{item.value} days</span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${Math.min((item.value / 30) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          ))}
          <p className="text-xs text-slate-400 pt-1">Total: {form.annualTotal + form.sickTotal} days per year</p>
        </div>
      </div>

      {msg && (
        <div className={`max-w-sm text-sm px-4 py-3 rounded-lg border ${
          msg.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
        }`}>
          {msg.text}
        </div>
      )}

      <div className="flex justify-end max-w-sm">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {saving ? "Updating…" : `Update Policy for ${policy.year}`}
        </button>
      </div>
    </div>
  );
}
