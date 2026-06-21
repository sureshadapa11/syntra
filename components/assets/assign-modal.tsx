"use client";

import { useState, useEffect } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, UserX } from "lucide-react";

interface User {
  id: string;
  name: string;
  avatar: string | null;
  jobTitle: string | null;
  department: { name: string } | null;
}

interface AssignModalProps {
  assetName: string;
  currentAssigneeId: string | null;
  onAssign: (userId: string | null) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function AssignModal({ assetName, currentAssigneeId, onAssign, onCancel, loading }: AssignModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch("/api/users?status=active")
      .then((r) => r.json())
      .then((data) => { setUsers(data); setFetching(false); });
  }, []);

  const filtered = users.filter(
    (u) => !search || u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">
      <p className="text-sm text-slate-500">
        Assign <span className="font-semibold text-slate-800">{assetName}</span> to a team member.
      </p>

      {/* Unassign option */}
      {currentAssigneeId && (
        <button
          onClick={() => onAssign(null)}
          disabled={loading}
          className="w-full flex items-center gap-3 px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
            <UserX size={16} />
          </div>
          <span className="text-sm font-medium">Unassign — return to available pool</span>
        </button>
      )}

      {/* Search */}
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
        <Search size={14} className="text-slate-400 shrink-0" />
        <input
          autoFocus
          type="text"
          placeholder="Search employees…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm bg-transparent focus:outline-none flex-1 text-slate-700 placeholder:text-slate-400"
        />
      </div>

      {/* User list */}
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {fetching ? (
          <div className="py-6 flex justify-center">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No employees found</p>
        ) : (
          filtered.map((user) => {
            const isCurrent = user.id === currentAssigneeId;
            return (
              <button
                key={user.id}
                onClick={() => onAssign(user.id)}
                disabled={loading || isCurrent}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${
                  isCurrent
                    ? "bg-blue-50 border border-blue-200 cursor-default"
                    : "hover:bg-slate-50 border border-transparent"
                }`}
              >
                <Avatar name={user.name} src={user.avatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {user.jobTitle ?? ""}
                    {user.department ? ` · ${user.department.name}` : ""}
                  </p>
                </div>
                {isCurrent && (
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full shrink-0">
                    Current
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      <div className="flex justify-end pt-2 border-t border-slate-100">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
