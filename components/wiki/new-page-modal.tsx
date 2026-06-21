"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";

interface NewPageModalProps {
  open: boolean;
  parentId?: string | null;
  parentTitle?: string;
  onClose: () => void;
  onCreated: (slug: string) => void;
}

export function NewPageModal({ open, parentId, parentTitle, onClose, onCreated }: NewPageModalProps) {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    setError("");
    const res = await fetch("/api/wiki", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), parentId: parentId ?? null, content: "" }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
    setTitle("");
    onCreated(data.slug);
  }

  function handleClose() {
    setTitle("");
    setError("");
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title={parentId ? `New sub-page under "${parentTitle}"` : "New Wiki Page"} size="sm">
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Page Title</label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
            placeholder="e.g. Getting Started"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
        <p className="text-xs text-slate-400">You can add content after the page is created.</p>
        <div className="flex justify-end gap-2">
          <button onClick={handleClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <button
            onClick={handleCreate}
            disabled={saving || !title.trim()}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg"
          >
            {saving ? "Creating…" : "Create Page"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
