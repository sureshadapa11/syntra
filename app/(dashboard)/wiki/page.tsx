import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { BookOpen, Plus, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function WikiPage() {
  const pages = await prisma.wikiPage.findMany({
    where: { parentId: null },
    include: { createdBy: true, _count: { select: { children: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Knowledge Base</h1>
          <p className="text-slate-500 mt-1">Internal docs and guides</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} />
          New Page
        </button>
      </div>

      <div className="max-w-3xl">
        {pages.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center py-20 text-slate-400">
            <BookOpen size={48} className="mb-3 opacity-40" />
            <p className="font-medium">No wiki pages yet</p>
            <p className="text-sm mt-1">Create your first knowledge base article</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {pages.map((page) => (
              <Link
                key={page.id}
                href={`/wiki/${page.slug}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group"
              >
                <BookOpen size={18} className="text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">
                    {page.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {page.createdBy.name} · Updated {formatDate(page.updatedAt)}
                    {page._count.children > 0 && ` · ${page._count.children} sub-pages`}
                  </p>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
