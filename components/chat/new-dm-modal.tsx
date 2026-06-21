"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { Search } from "lucide-react";

interface User {
  id: string; name: string; avatar: string | null; jobTitle: string | null;
  department: { name: string } | null;
}

interface NewDmModalProps {
  open: boolean;
  currentUserId: string;
  onClose: () => void;
  onCreated: (channelId: string) => void;
}

export function NewDmModal({ open, currentUserId, onClose, onCreated }: NewDmModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/users?status=active").then((r) => r.json()).then((data) => {
      setUsers(data.filter((u: User) => u.id !== currentUserId));
    });
  }, [open, currentUserId]);

  const filtered = users.filter((u) =>
    !search || u.name.toLowerCase().includes(search.toLowerCase())
  );

  async function startDm(userId: string) {
    setCreating(userId);
    const res = await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "direct", memberIds: [userId] }),
    });
    const data = await res.json();
    setCreating(null);
    if (res.ok) { setSearch(""); onCreated(data.id); }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Direct Message" size="sm">
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <Search size={13} className="text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none flex-1"
          />
        </div>

        <div className="space-y-1 max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No users found</p>
          ) : (
            filtered.map((user) => (
              <button
                key={user.id}
                onClick={() => startDm(user.id)}
                disabled={creating === user.id}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-left transition-colors disabled:opacity-50"
              >
                <Avatar name={user.name} src={user.avatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {user.jobTitle}{user.department ? ` · ${user.department.name}` : ""}
                  </p>
                </div>
                {creating === user.id && (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
