"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { Search, X, Hash } from "lucide-react";

interface User {
  id: string; name: string; avatar: string | null; jobTitle: string | null;
}

interface NewChannelModalProps {
  open: boolean;
  currentUserId: string;
  onClose: () => void;
  onCreated: (channelId: string) => void;
}

export function NewChannelModal({ open, currentUserId, onClose, onCreated }: NewChannelModalProps) {
  const [name, setName] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    fetch("/api/users?status=active").then((r) => r.json()).then((data) => {
      setUsers(data.filter((u: User) => u.id !== currentUserId));
    });
  }, [open, currentUserId]);

  const filtered = users.filter(
    (u) => !search || u.name.toLowerCase().includes(search.toLowerCase())
  ).filter((u) => !selected.find((s) => s.id === u.id));

  function toggle(user: User) {
    setSelected((prev) =>
      prev.find((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    );
  }

  async function create() {
    if (!name.trim()) { setError("Channel name is required"); return; }
    setSaving(true);
    setError("");
    const res = await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "channel", name: name.trim(), memberIds: selected.map((u) => u.id) }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
    setName(""); setSelected([]); setSearch("");
    onCreated(data.id);
  }

  function handleClose() {
    setName(""); setSelected([]); setSearch(""); setError("");
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="New Channel" size="md">
      <div className="p-5 space-y-4">
        {/* Channel name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Channel Name</label>
          <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-400">
            <Hash size={14} className="text-slate-400 shrink-0" />
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))}
              placeholder="e.g. general, engineering"
              className="flex-1 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none bg-transparent"
            />
          </div>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>

        {/* Add members */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Add Members</label>

          {/* Selected chips */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selected.map((u) => (
                <span key={u.id} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                  {u.name}
                  <button onClick={() => toggle(u)}><X size={10} /></button>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-2">
            <Search size={13} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search members…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none flex-1"
            />
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto">
            {filtered.slice(0, 20).map((user) => (
              <button
                key={user.id}
                onClick={() => toggle(user)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 text-left transition-colors"
              >
                <Avatar name={user.name} src={user.avatar} size="xs" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                  {user.jobTitle && <p className="text-xs text-slate-400 truncate">{user.jobTitle}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-400">{selected.length} member{selected.length !== 1 ? "s" : ""} added (you are always included)</p>
          <div className="flex gap-2">
            <button onClick={handleClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
            <button
              onClick={create}
              disabled={saving || !name.trim()}
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg"
            >
              {saving ? "Creating…" : "Create Channel"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
