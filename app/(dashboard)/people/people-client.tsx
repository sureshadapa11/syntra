"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Search, Plus, LayoutGrid, List, Filter, MoreVertical, Mail, Phone, Pencil, Trash2, Eye } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmployeeForm } from "@/components/people/employee-form";
import { formatDate } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  jobTitle?: string | null;
  employmentType: string;
  status: string;
  startDate?: Date | null;
  avatar?: string | null;
  role: { name: string };
  department?: { id: string; name: string } | null;
  team?: { id: string; name: string } | null;
  manager?: { id: string; name: string } | null;
}

interface Dept { id: string; name: string; }
interface Role { id: string; name: string; }

interface Props {
  initialUsers: User[];
  departments: Dept[];
  roles: Role[];
}

const statusVariant: Record<string, "success" | "warning" | "danger" | "default"> = {
  active: "success",
  inactive: "danger",
  "on-leave": "warning",
};

const roleVariant: Record<string, "info" | "purple" | "warning" | "danger" | "default"> = {
  admin: "danger",
  manager: "purple",
  developer: "info",
  hr: "warning",
  viewer: "default",
};

export function PeopleClient({ initialUsers, departments, roles }: Props) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !search ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.jobTitle ?? "").toLowerCase().includes(search.toLowerCase());
      const matchDept = !filterDept || u.department?.id === filterDept;
      const matchStatus = !filterStatus || u.status === filterStatus;
      return matchSearch && matchDept && matchStatus;
    });
  }, [users, search, filterDept, filterStatus]);

  async function handleAddEmployee(data: any) {
    const skillsArray = data.skills
      ? data.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, skills: skillsArray }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to add employee");
    }

    const newUser = await res.json();
    setUsers((prev) => [...prev, newUser].sort((a, b) => a.name.localeCompare(b.name)));
    setShowAdd(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleteLoading(true);
    await fetch(`/api/users/${deleteId}`, { method: "DELETE" });
    setUsers((prev) => prev.map((u) => u.id === deleteId ? { ...u, status: "inactive" } : u));
    setDeleteId(null);
    setDeleteLoading(false);
  }

  const activeCount = users.filter((u) => u.status === "active").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">People</h1>
          <p className="text-slate-500 text-sm mt-0.5">{activeCount} active · {users.length} total</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={16} />
          Add Employee
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm bg-white border border-slate-200 rounded-lg px-3 py-2">
          <Search size={15} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by name, email, title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm focus:outline-none text-slate-700 placeholder:text-slate-400 bg-transparent"
          />
        </div>

        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="on-leave">On Leave</option>
        </select>

        <div className="ml-auto flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
          <button onClick={() => setView("grid")} className={`p-1.5 rounded-md transition-colors ${view === "grid" ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:text-slate-600"}`}>
            <LayoutGrid size={15} />
          </button>
          <button onClick={() => setView("list")} className={`p-1.5 rounded-md transition-colors ${view === "list" ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:text-slate-600"}`}>
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Results count */}
      {search || filterDept || filterStatus ? (
        <p className="text-sm text-slate-500">{filtered.length} result{filtered.length !== 1 ? "s" : ""} found</p>
      ) : null}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center py-20">
          <Users size={48} className="text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">No employees found</p>
          <p className="text-sm text-slate-400 mt-1">
            {search || filterDept || filterStatus ? "Try adjusting your filters" : "Add your first team member"}
          </p>
          {!search && !filterDept && !filterStatus && (
            <Button className="mt-4" onClick={() => setShowAdd(true)}>
              <Plus size={15} /> Add Employee
            </Button>
          )}
        </div>
      )}

      {/* Grid View */}
      {view === "grid" && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((user) => (
            <div key={user.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all group relative">
              {/* Menu */}
              <div className="absolute top-3 right-3">
                <button
                  onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical size={15} />
                </button>
                {openMenuId === user.id && (
                  <div className="absolute right-0 top-8 w-36 bg-white rounded-xl border border-slate-200 shadow-lg z-10 py-1">
                    <Link href={`/people/${user.id}`} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setOpenMenuId(null)}>
                      <Eye size={13} /> View Profile
                    </Link>
                    <Link href={`/people/${user.id}/edit`} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setOpenMenuId(null)}>
                      <Pencil size={13} /> Edit
                    </Link>
                    <button
                      onClick={() => { setDeleteId(user.id); setOpenMenuId(null); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={13} /> Deactivate
                    </button>
                  </div>
                )}
              </div>

              <Link href={`/people/${user.id}`} className="flex flex-col items-center text-center">
                <Avatar name={user.name} src={user.avatar} size="xl" className="mb-3" />
                <p className="font-semibold text-slate-900 text-sm leading-tight">{user.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{user.jobTitle ?? "—"}</p>

                <div className="flex items-center gap-1.5 mt-3 flex-wrap justify-center">
                  <Badge variant={statusVariant[user.status] ?? "default"} className="capitalize">{user.status}</Badge>
                  <Badge variant={roleVariant[user.role.name] ?? "default"} className="capitalize">{user.role.name}</Badge>
                </div>

                {user.department && (
                  <p className="text-xs text-slate-400 mt-2">{user.department.name}</p>
                )}
              </Link>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5">
                <a href={`mailto:${user.email}`} className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600 truncate">
                  <Mail size={12} /> {user.email}
                </a>
                {user.phone && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone size={12} /> {user.phone}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === "list" && filtered.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-12 px-5 py-3 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
            <div className="col-span-4">Employee</div>
            <div className="col-span-2">Department</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Joined</div>
            <div className="col-span-1" />
          </div>

          <div className="divide-y divide-slate-100">
            {filtered.map((user) => (
              <div key={user.id} className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-slate-50 transition-colors group">
                <div className="col-span-4 flex items-center gap-3">
                  <Avatar name={user.name} src={user.avatar} size="sm" />
                  <div className="min-w-0">
                    <Link href={`/people/${user.id}`} className="text-sm font-medium text-slate-900 hover:text-blue-600 truncate block">
                      {user.name}
                    </Link>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="col-span-2 text-sm text-slate-600 truncate">
                  {user.department?.name ?? "—"}
                </div>
                <div className="col-span-2">
                  <Badge variant={roleVariant[user.role.name] ?? "default"} className="capitalize">{user.role.name}</Badge>
                </div>
                <div className="col-span-2">
                  <Badge variant={statusVariant[user.status] ?? "default"} className="capitalize">{user.status}</Badge>
                </div>
                <div className="col-span-1 text-xs text-slate-400">
                  {user.startDate ? formatDate(user.startDate) : "—"}
                </div>
                <div className="col-span-1 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/people/${user.id}`} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                    <Eye size={14} />
                  </Link>
                  <Link href={`/people/${user.id}/edit`} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                    <Pencil size={14} />
                  </Link>
                  <button onClick={() => setDeleteId(user.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Employee" size="lg">
        <EmployeeForm
          onSubmit={handleAddEmployee}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Deactivate Employee"
        description="This will mark the employee as inactive. They will no longer be able to log in. You can reactivate them later from their profile."
        confirmLabel="Deactivate"
        loading={deleteLoading}
      />
    </div>
  );
}
