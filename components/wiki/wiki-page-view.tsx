"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Pencil, Trash2, ChevronRight, Save, X, BookOpen, Clock, User, Plus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { WikiEditor } from "./wiki-editor";
import { renderMarkdown } from "@/lib/markdown";
import { formatDate } from "@/lib/utils";

interface WikiPage {
  id: string; title: string; content: string; slug: string;
  createdAt: string; updatedAt: string;
  createdBy: { id: string; name: string; avatar: string | null };
  updatedBy: { id: string; name: string; avatar: string | null } | null;
  parent: { id: string; title: string; slug: string } | null;
  children: { id: string; title: string; slug: string; _count: { children: number } }[];
}

interface WikiPageViewProps {
  page: WikiPage;
  onNewChild: (parentId: string) => void;
  onDeleted: () => void;
  onUpdated: (page: WikiPage) => void;
}

export function WikiPageView({ page, onNewChild, onDeleted, onUpdated }: WikiPageViewProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const canEdit = !!session?.user;
  const canDelete = session?.user?.id === page.createdBy.id || session?.user?.role === "admin";

  async function save() {
    if (!title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    setError("");
    const res = await fetch(`/api/wiki/${page.slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Failed to save"); return; }
    onUpdated(data);
    setEditing(false);
  }

  function cancelEdit() {
    setTitle(page.title);
    setContent(page.content);
    setEditing(false);
    setError("");
  }

  async function confirmDelete() {
    setDeleting(true);
    const res = await fetch(`/api/wiki/${page.slug}`, { method: "DELETE" });
    const data = await res.json();
    setDeleting(false);
    if (!res.ok) { alert(data.error); return; }
    onDeleted();
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-4 h-full">
        {/* Edit header */}
        <div className="flex items-center gap-3">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 text-2xl font-bold text-slate-900 border-b-2 border-blue-400 bg-transparent focus:outline-none pb-1"
            placeholder="Page title"
          />
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Save size={14} /> {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={cancelEdit} className="flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium">
            <X size={14} /> Cancel
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex-1 min-h-0" style={{ height: "calc(100vh - 280px)" }}>
          <WikiEditor value={content} onChange={setContent} />
        </div>

        {/* Markdown cheatsheet */}
        <details className="text-xs text-slate-500">
          <summary className="cursor-pointer hover:text-slate-700 font-medium">Markdown reference</summary>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 bg-slate-50 border border-slate-100 rounded-lg p-3 font-mono">
            {[
              ["# H1, ## H2, ### H3", "Headings"],
              ["**bold**, *italic*", "Emphasis"],
              ["`code`", "Inline code"],
              ["```\ncode block\n```", "Code block"],
              ["- item", "Bullet list"],
              ["1. item", "Ordered list"],
              ["> quote", "Blockquote"],
              ["[text](url)", "Link"],
              ["![alt](url)", "Image"],
              ["---", "Divider"],
            ].map(([syntax, label]) => (
              <div key={label}>
                <span className="text-blue-700">{syntax}</span>
                <span className="text-slate-400 ml-2">→ {label}</span>
              </div>
            ))}
          </div>
        </details>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      {page.parent && (
        <nav className="flex items-center gap-1 mb-4 text-xs text-slate-400">
          <button onClick={() => router.push("/wiki")} className="hover:text-blue-600">Wiki</button>
          <ChevronRight size={11} />
          <button onClick={() => router.push(`/wiki/${page.parent!.slug}`)} className="hover:text-blue-600">{page.parent.title}</button>
          <ChevronRight size={11} />
          <span className="text-slate-600 font-medium">{page.title}</span>
        </nav>
      )}

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-slate-900 leading-tight flex-1">{page.title}</h1>
        <div className="flex items-center gap-1 shrink-0">
          {canEdit && (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <Pencil size={13} /> Edit
            </button>
          )}
          {canDelete && (
            <button onClick={() => setShowDelete(true)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100 text-xs text-slate-400 flex-wrap">
        <span className="flex items-center gap-1.5">
          <Avatar name={page.createdBy.name} src={page.createdBy.avatar} size="xs" />
          <User size={10} /> Created by {page.createdBy.name} · {formatDate(page.createdAt)}
        </span>
        {page.updatedBy && page.updatedAt !== page.createdAt && (
          <span className="flex items-center gap-1.5">
            <Clock size={10} /> Updated by {page.updatedBy.name} · {formatDate(page.updatedAt)}
          </span>
        )}
      </div>

      {/* Content */}
      {page.content.trim() ? (
        <div
          className="min-h-[100px]"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content) }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
          <BookOpen size={32} className="mb-2 opacity-30" />
          <p className="font-medium text-slate-500">This page is empty</p>
          {canEdit && (
            <button onClick={() => setEditing(true)} className="mt-3 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
              <Pencil size={13} /> Start writing
            </button>
          )}
        </div>
      )}

      {/* Sub-pages */}
      {(page.children.length > 0 || canEdit) && (
        <div className="mt-10 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Sub-pages</p>
            {canEdit && (
              <button onClick={() => onNewChild(page.id)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <Plus size={11} /> Add sub-page
              </button>
            )}
          </div>
          {page.children.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {page.children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => router.push(`/wiki/${child.slug}`)}
                  className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-200 text-left transition-colors group"
                >
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                    <BookOpen size={14} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 group-hover:text-blue-700 truncate">{child.title}</p>
                    {child._count.children > 0 && (
                      <p className="text-xs text-slate-400">{child._count.children} sub-page{child._count.children !== 1 ? "s" : ""}</p>
                    )}
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-400 shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No sub-pages yet</p>
          )}
        </div>
      )}

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={confirmDelete}
        title="Delete Page"
        description={`Delete "${page.title}"? This cannot be undone. Sub-pages must be deleted first.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
