"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { WikiTree } from "@/components/wiki/wiki-tree";
import { WikiPageView } from "@/components/wiki/wiki-page-view";
import { NewPageModal } from "@/components/wiki/new-page-modal";
import { BookOpen } from "lucide-react";

interface WikiPage {
  id: string; title: string; content: string; slug: string;
  createdAt: string; updatedAt: string;
  createdBy: { id: string; name: string; avatar: string | null };
  updatedBy: { id: string; name: string; avatar: string | null } | null;
  parent: { id: string; title: string; slug: string } | null;
  children: { id: string; title: string; slug: string; _count: { children: number } }[];
}

export default function WikiSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [page, setPage] = useState<WikiPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newParentId, setNewParentId] = useState<string | undefined>();
  const [newParentTitle, setNewParentTitle] = useState<string | undefined>();

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    fetch(`/api/wiki/${slug}`)
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); setLoading(false); return; }
        setPage(await res.json());
        setLoading(false);
      });
  }, [slug]);

  function openNewChild(parentId: string) {
    setNewParentId(parentId);
    setNewParentTitle(page?.title);
    setShowNew(true);
  }

  function openNewPage(parentId?: string) {
    setNewParentId(parentId);
    setNewParentTitle(undefined);
    setShowNew(true);
  }

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto flex gap-6">
        <div className="w-60 shrink-0" />
        <div className="flex-1 flex justify-center pt-20">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="p-6 max-w-6xl mx-auto flex gap-6">
        <WikiTree onNewPage={openNewPage} />
        <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-400">
          <BookOpen size={48} className="mb-3 opacity-25" />
          <p className="font-semibold text-slate-600 text-lg">Page not found</p>
          <button onClick={() => router.push("/wiki")} className="mt-4 text-sm text-blue-600 hover:underline">← Back to Wiki</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex gap-6">
        {/* Sidebar */}
        <WikiTree onNewPage={openNewPage} />

        {/* Page content */}
        <main className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl p-8">
          {page && (
            <WikiPageView
              page={page}
              onNewChild={openNewChild}
              onDeleted={() => router.push("/wiki")}
              onUpdated={(updated) => setPage(updated)}
            />
          )}
        </main>
      </div>

      <NewPageModal
        open={showNew}
        parentId={newParentId}
        parentTitle={newParentTitle}
        onClose={() => setShowNew(false)}
        onCreated={(newSlug) => { setShowNew(false); router.push(`/wiki/${newSlug}`); }}
      />
    </div>
  );
}
