"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Plus, ChevronRight, Clock, FileText } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { WikiTree } from "@/components/wiki/wiki-tree";
import { NewPageModal } from "@/components/wiki/new-page-modal";
import { formatDate } from "@/lib/utils";

interface WikiPage {
  id: string; title: string; slug: string; createdAt: string; updatedAt: string;
  createdBy: { id: string; name: string; avatar: string | null };
  updatedBy: { id: string; name: string } | null;
  _count: { children: number };
}

export default function WikiIndexPage() {
  const router = useRouter();
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newParentId, setNewParentId] = useState<string | undefined>();

  useEffect(() => {
    fetch("/api/wiki").then((r) => r.json()).then((data) => { setPages(data); setLoading(false); });
  }, []);

  function openNewPage(parentId?: string) {
    setNewParentId(parentId);
    setShowNew(true);
  }

  function handleCreated(slug: string) {
    setShowNew(false);
    router.push(`/wiki/${slug}`);
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex gap-6">
        {/* Sidebar */}
        <WikiTree onNewPage={openNewPage} />

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Knowledge Base</h1>
              <p className="text-sm text-slate-500 mt-0.5">Team docs, guides, and internal knowledge</p>
            </div>
            <button
              onClick={() => openNewPage()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={14} /> New Page
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
              <BookOpen size={48} className="mb-3 opacity-25" />
              <p className="font-semibold text-slate-600 text-base">No wiki pages yet</p>
              <p className="text-sm mt-1 mb-5">Start documenting your team's knowledge</p>
              <button onClick={() => openNewPage()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                <Plus size={14} /> Create first page
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Stats strip */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                    <FileText size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">{pages.length}</p>
                    <p className="text-xs text-slate-400">Total pages</p>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                    <BookOpen size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">{pages.filter((p) => p._count.children > 0).length}</p>
                    <p className="text-xs text-slate-400">Has sub-pages</p>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
                    <Clock size={16} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Last updated</p>
                    <p className="text-sm font-semibold text-slate-700">{formatDate(pages[0].updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Page list */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">All Pages</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {pages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => router.push(`/wiki/${page.slug}`)}
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left group"
                    >
                      <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-50">
                        <BookOpen size={16} className="text-slate-500 group-hover:text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 truncate">{page.title}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Avatar name={page.createdBy.name} src={page.createdBy.avatar} size="xs" />
                            {page.createdBy.name}
                          </span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock size={10} /> {formatDate(page.updatedAt)}
                          </span>
                          {page._count.children > 0 && (
                            <>
                              <span className="text-xs text-slate-400">·</span>
                              <span className="text-xs text-slate-400">{page._count.children} sub-page{page._count.children !== 1 ? "s" : ""}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={15} className="text-slate-300 group-hover:text-blue-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <NewPageModal
        open={showNew}
        parentId={newParentId}
        onClose={() => setShowNew(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
