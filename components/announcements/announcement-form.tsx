"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AlertCircle, Pin } from "lucide-react";

interface Department { id: string; name: string; }

interface AnnouncementFormProps {
  departments: Department[];
  initial?: {
    id: string;
    title: string;
    content: string;
    departmentId: string | null;
    pinned: boolean;
  };
  onSuccess: (ann: any) => void;
  onCancel: () => void;
}

export function AnnouncementForm({ departments, initial, onSuccess, onCancel }: AnnouncementFormProps) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    content: initial?.content ?? "",
    departmentId: initial?.departmentId ?? "",
    pinned: initial?.pinned ?? false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!initial;

  const deptOptions = [
    { value: "", label: "Company-wide (everyone)" },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];

  function set(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.content.trim()) { setError("Content is required"); return; }

    setLoading(true);

    const url = isEdit ? `/api/announcements/${initial!.id}` : "/api/announcements";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title.trim(),
        content: form.content.trim(),
        departmentId: form.departmentId || null,
        pinned: form.pinned,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "Failed to save"); return; }
    onSuccess(data);
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <Input
        id="ann-title"
        label="Title"
        placeholder="What's the announcement about?"
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="ann-content" className="text-sm font-medium text-slate-700">Content</label>
        <textarea
          id="ann-content"
          rows={6}
          value={form.content}
          onChange={(e) => set("content", e.target.value)}
          placeholder="Write your announcement here…"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
        />
        <p className="text-xs text-slate-400">{form.content.length} characters</p>
      </div>

      <Select
        id="ann-dept"
        label="Audience"
        value={form.departmentId}
        onChange={(e) => set("departmentId", e.target.value)}
        options={deptOptions}
      />

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div
          onClick={() => set("pinned", !form.pinned)}
          className={`w-10 h-5 rounded-full transition-colors relative ${form.pinned ? "bg-blue-600" : "bg-slate-200"}`}
        >
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.pinned ? "translate-x-5" : "translate-x-0.5"}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <Pin size={13} className="text-slate-400" /> Pin this announcement
          </p>
          <p className="text-xs text-slate-400">Pinned posts appear at the top of the feed</p>
        </div>
      </label>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2.5 rounded-lg border border-red-100">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>
          {isEdit ? "Save Changes" : "Post Announcement"}
        </Button>
      </div>
    </form>
  );
}
