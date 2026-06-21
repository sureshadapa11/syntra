"use client";

import { useState, useEffect } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { UserPlus, Trash2, Crown, Search } from "lucide-react";

interface Member {
  id: string;
  role: string;
  user: { id: string; name: string; avatar: string | null; jobTitle: string | null; email: string; department: { name: string } | null };
}

interface User {
  id: string;
  name: string;
  avatar: string | null;
  jobTitle: string | null;
  email: string;
}

interface MembersPanelProps {
  projectId: string;
  currentUserId: string;
}

const roleColors: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  lead: "bg-blue-100 text-blue-700",
  member: "bg-slate-100 text-slate-600",
};

export function MembersPanel({ projectId, currentUserId }: MembersPanelProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}/members`).then((r) => r.json()),
      fetch("/api/users?status=active").then((r) => r.json()),
    ]).then(([m, u]) => {
      setMembers(m);
      setAllUsers(u);
      setLoading(false);
    });
  }, [projectId]);

  const memberIds = new Set(members.map((m) => m.user.id));
  const nonMembers = allUsers.filter(
    (u) => !memberIds.has(u.id) && (!search || u.name.toLowerCase().includes(search.toLowerCase()))
  );

  async function handleAdd(userId: string) {
    const res = await fetch(`/api/projects/${projectId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: "member" }),
    });
    const newMember = await res.json();
    setMembers((m) => [...m, newMember]);
  }

  async function handleRemove() {
    if (!removeId) return;
    setRemoving(true);
    await fetch(`/api/projects/${projectId}/members/${removeId}`, { method: "DELETE" });
    setMembers((m) => m.filter((mem) => mem.user.id !== removeId));
    setRemoveId(null);
    setRemoving(false);
  }

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Project Members</h2>
              <p className="text-xs text-slate-400 mt-0.5">{members.length} members</p>
            </div>
            <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
              <UserPlus size={13} /> Add Member
            </Button>
          </div>

          {/* Add member search */}
          {showAdd && (
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-2">Add team member</p>
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 mb-3">
                <Search size={13} className="text-slate-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="text-sm bg-transparent focus:outline-none flex-1 text-slate-700 placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {nonMembers.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-3">
                    {search ? "No users found" : "All active users are already members"}
                  </p>
                ) : (
                  nonMembers.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white transition-colors">
                      <Avatar name={u.name} src={u.avatar} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">{u.name}</p>
                        <p className="text-xs text-slate-400 truncate">{u.jobTitle ?? u.email}</p>
                      </div>
                      <button
                        onClick={() => handleAdd(u.id)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Members list */}
          <div className="divide-y divide-slate-100">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                <Avatar name={member.user.name} src={member.user.avatar} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{member.user.name}</p>
                    {member.role === "admin" && <Crown size={12} className="text-amber-500" />}
                  </div>
                  <p className="text-xs text-slate-400">{member.user.jobTitle ?? member.user.email}</p>
                  {member.user.department && (
                    <p className="text-xs text-slate-400">{member.user.department.name}</p>
                  )}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${roleColors[member.role] ?? "bg-slate-100 text-slate-600"}`}>
                  {member.role}
                </span>
                {member.user.id !== currentUserId && (
                  <button
                    onClick={() => setRemoveId(member.user.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                    title="Remove member"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!removeId}
        onClose={() => setRemoveId(null)}
        onConfirm={handleRemove}
        title="Remove Member"
        description="Remove this person from the project? Their tasks will remain but they'll lose access."
        confirmLabel="Remove"
        loading={removing}
      />
    </>
  );
}
