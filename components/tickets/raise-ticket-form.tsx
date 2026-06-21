"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";

interface RaiseTicketFormProps {
  onSuccess: (ticket: any) => void;
  onCancel: () => void;
}

const categoryOptions = [
  { value: "IT", label: "IT — Hardware, software, access" },
  { value: "HR", label: "HR — Policies, payroll, onboarding" },
  { value: "Finance", label: "Finance — Expenses, reimbursements" },
  { value: "Admin", label: "Admin — Facilities, supplies" },
  { value: "Other", label: "Other" },
];

const priorityOptions = [
  { value: "critical", label: "Critical — Blocking work entirely" },
  { value: "high", label: "High — Major impact" },
  { value: "medium", label: "Medium — Moderate impact" },
  { value: "low", label: "Low — Minor or cosmetic" },
];

export function RaiseTicketForm({ onSuccess, onCancel }: RaiseTicketFormProps) {
  const [form, setForm] = useState({ title: "", description: "", category: "IT", priority: "medium" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Please enter a title"); return; }

    setLoading(true);
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "Failed to raise ticket"); return; }
    onSuccess(data);
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <Input
        id="tkt-title"
        label="What do you need help with?"
        placeholder="Brief description of the issue"
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select id="tkt-cat" label="Category" value={form.category} onChange={(e) => set("category", e.target.value)} options={categoryOptions} />
        <Select id="tkt-pri" label="Priority" value={form.priority} onChange={(e) => set("priority", e.target.value)} options={priorityOptions} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="tkt-desc" className="text-sm font-medium text-slate-700">
          Details <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="tkt-desc"
          rows={4}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Describe the issue in detail — steps to reproduce, error messages, affected systems…"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2.5 rounded-lg border border-red-100">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-100 text-xs text-slate-500">
        SLA response times — Critical: 4h · High: 8h · Medium: 24h · Low: 72h
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>Submit Ticket</Button>
      </div>
    </form>
  );
}
