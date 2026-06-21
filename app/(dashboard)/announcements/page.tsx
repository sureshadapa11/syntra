"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AnnouncementCard } from "@/components/announcements/announcement-card";
import { AnnouncementForm } from "@/components/announcements/announcement-form";
import { Modal } from "@/components/ui/modal";
import { Megaphone, Plus, Search, Globe, Building2 } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  departmentId: string | null;
  createdBy: { id: string; name: string; avatar: string | null; jobTitle: string | null };
  department: { id: string; name: string } | null;
}

interface Department { id: string; name: string; }

const CAN_POST_ROLES = ["admin", "manager", "hr"];

export default function AnnouncementsPage() {
  const { data: session } = useSession();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [showForm, setShowForm] = useState(false);

  const canPost = CAN_POST_ROLES.includes(session?.user?.role ?? "");
  const canManage = canPost;

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterDept) params.set("departmentId", filterDept);
    if (search) params.set("search", search);
    const res = await fetch(`/api/announcements?${params}`);
    setAnnouncements(await res.json());
    setLoading(false);
  }, [filterDept, search]);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json())
      .then(setDepartments);
  }, []);

  function handleCreated(ann: Announcement) {
    setAnnouncements((prev) => {
      const updated = [ann, ...prev];
      return updated.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    });
    setShowForm(false);
  }

  function handleUpdated(updated: Announcement) {
    setAnnouncements((prev) => {
      const list = prev.map((a) => (a.id === updated.id ? updated : a));
      return list.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    });
  }

  function handleDeleted(id: string) {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  }

  const pinned = announcements.filter((a) => a.pinned);
  const unpinned = announcements.filter((a) => !a.pinned);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
          <p className="text-sm text-slate-500 mt-1">Company news, updates, and important messages</p>
        </div>
        {canPost && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={15} /> Post Announcement
          </button>
        )}
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <Search size={14} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search announcements…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm bg-transparent focus:outline-none text-slate-700 flex-1 placeholder:text-slate-400"
          />
        </div>

        {/* Department filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterDept("")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterDept === "" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Globe size={11} /> All
          </button>
          <button
            onClick={() => setFilterDept("company")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterDept === "company" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Globe size={11} /> Company-wide
          </button>
          {departments.map((d) => (
            <button
              key={d.id}
              onClick={() => setFilterDept(filterDept === d.id ? "" : d.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterDept === d.id ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Building2 size={11} /> {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-20">
          <Megaphone size={48} className="text-slate-300 mb-3" />
          <p className="font-semibold text-slate-600">
            {search || filterDept ? "No announcements match your filters" : "No announcements yet"}
          </p>
          {!search && !filterDept && canPost && (
            <>
              <p className="text-sm text-slate-400 mt-1">Be the first to share a company update</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus size={14} /> Post Announcement
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <AnnouncementCard
              key={ann.id}
              ann={ann}
              departments={departments}
              canManage={canManage}
              currentUserId={session?.user?.id ?? ""}
              onUpdate={handleUpdated}
              onDelete={handleDeleted}
            />
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Post Announcement" size="lg">
        <AnnouncementForm
          departments={departments}
          onSuccess={handleCreated}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}
