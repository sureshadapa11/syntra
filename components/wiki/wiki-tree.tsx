"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { BookOpen, ChevronRight, ChevronDown, Plus, Search, X } from "lucide-react";

interface TreePage {
  id: string; title: string; slug: string;
  _count: { children: number };
}

interface WikiTreeProps {
  onNewPage: (parentId?: string) => void;
}

export function WikiTree({ onNewPage }: WikiTreeProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [pages, setPages] = useState<TreePage[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [children, setChildren] = useState<Record<string, TreePage[]>>({});
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<TreePage[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetch("/api/wiki").then((r) => r.json()).then(setPages);
  }, []);

  useEffect(() => {
    if (!search.trim()) { setSearchResults(null); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/wiki?search=${encodeURIComponent(search)}`);
      setSearchResults(await res.json());
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  async function toggleExpand(page: TreePage) {
    const id = page.id;
    if (expanded.has(id)) {
      setExpanded((prev) => { const s = new Set(prev); s.delete(id); return s; });
    } else {
      setExpanded((prev) => new Set(prev).add(id));
      if (!children[id]) {
        const res = await fetch(`/api/wiki?flat=1`);
        const all: TreePage[] = await res.json();
        // filter by parentId — we need to refetch with parentId support
        // For now load all and filter client-side using a tree approach
        // Actually we need a dedicated endpoint, let's just load all pages flat and build client tree
        const childPages = all.filter((p) => {
          // We check if this page's parent matches
          return false; // placeholder
        });
        setChildren((prev) => ({ ...prev, [id]: childPages }));
      }
    }
  }

  // Build tree from flat pages by loading children on demand
  async function loadChildren(parentId: string) {
    if (children[parentId]) return;
    const res = await fetch(`/api/wiki?flat=1`);
    const all: TreePage[] = await res.json();
    // We'll build a full tree client-side
    setChildren((prev) => ({ ...prev, _all: all } as Record<string, TreePage[]>));
  }

  const currentSlug = pathname.split("/wiki/")[1];

  const displayPages = searchResults ?? pages;

  return (
    <aside className="w-60 shrink-0 flex flex-col gap-3">
      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
        <Search size={12} className="text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search wiki…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-xs bg-transparent focus:outline-none flex-1 text-slate-700 placeholder:text-slate-400"
        />
        {search && <button onClick={() => setSearch("")}><X size={11} className="text-slate-400" /></button>}
      </div>

      {/* New root page */}
      <button
        onClick={() => onNewPage()}
        className="flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:text-blue-700 px-1"
      >
        <Plus size={12} /> New Page
      </button>

      {/* Page list */}
      <nav className="space-y-0.5 flex-1 overflow-y-auto">
        {searching && <p className="text-xs text-slate-400 px-2">Searching…</p>}
        {displayPages.length === 0 && !searching && (
          <p className="text-xs text-slate-400 px-2">{search ? "No results" : "No pages yet"}</p>
        )}
        {displayPages.map((page) => (
          <WikiTreeItem
            key={page.id}
            page={page}
            depth={0}
            currentSlug={currentSlug}
            onNavigate={(slug) => router.push(`/wiki/${slug}`)}
            onNewChild={(parentId) => onNewPage(parentId)}
          />
        ))}
      </nav>
    </aside>
  );
}

function WikiTreeItem({ page, depth, currentSlug, onNavigate, onNewChild }: {
  page: TreePage; depth: number; currentSlug: string;
  onNavigate: (slug: string) => void;
  onNewChild: (parentId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [childPages, setChildPages] = useState<TreePage[] | null>(null);
  const isActive = currentSlug === page.slug;
  const hasChildren = page._count.children > 0;

  async function handleExpand(e: React.MouseEvent) {
    e.stopPropagation();
    if (!expanded && !childPages) {
      const res = await fetch(`/api/wiki?flat=1`);
      const all: (TreePage & { parentId: string | null })[] = await res.json();
      setChildPages(all.filter((p) => p.parentId === page.id));
    }
    setExpanded((v) => !v);
  }

  return (
    <div>
      <div
        className={`flex items-center gap-1 rounded-lg px-2 py-1.5 cursor-pointer group transition-colors ${
          isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
        style={{ paddingLeft: `${(depth * 12) + 8}px` }}
        onClick={() => onNavigate(page.slug)}
      >
        <button
          onClick={handleExpand}
          className={`shrink-0 ${!hasChildren ? "invisible" : ""}`}
        >
          {expanded ? <ChevronDown size={11} className="text-slate-400" /> : <ChevronRight size={11} className="text-slate-400" />}
        </button>
        <BookOpen size={12} className={isActive ? "text-blue-500 shrink-0" : "text-slate-400 shrink-0"} />
        <span className="text-xs font-medium truncate flex-1">{page.title}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onNewChild(page.id); }}
          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-all"
        >
          <Plus size={11} />
        </button>
      </div>

      {expanded && childPages && childPages.map((child) => (
        <WikiTreeItem
          key={child.id}
          page={child}
          depth={depth + 1}
          currentSlug={currentSlug}
          onNavigate={onNavigate}
          onNewChild={onNewChild}
        />
      ))}
    </div>
  );
}
