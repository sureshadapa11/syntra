"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Folder, FolderOpen, Upload, Plus, Search, ChevronRight, Home,
  Trash2, Download, Pencil, X, Check, MoreHorizontal, Grid3X3, List,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FileIcon, mimeLabel, formatBytes } from "./file-icon";
import { formatDate } from "@/lib/utils";

interface FolderItem {
  id: string; name: string; parentId: string | null;
  createdBy: { id: string; name: string };
  _count: { files: number; children: number };
  createdAt: string;
}
interface FileItem {
  id: string; name: string; url: string; size: number; mimeType: string;
  folderId: string | null; createdAt: string;
  uploadedBy: { id: string; name: string; avatar: string | null };
}
interface Crumb { id: string | null; name: string }

export function FileBrowser() {
  const { data: session } = useSession();
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [crumbs, setCrumbs] = useState<Crumb[]>([{ id: null, name: "My Files" }]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // New folder
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [savingFolder, setSavingFolder] = useState(false);

  // Rename
  const [renaming, setRenaming] = useState<{ type: "folder" | "file"; id: string; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<{ type: "folder" | "file"; id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: FolderItem | FileItem; type: "folder" | "file" } | null>(null);

  // Drag over state
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentFolderId = crumbs[crumbs.length - 1].id;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (!search && currentFolderId) params.set("parentId", currentFolderId);
    if (search) {
      const [fl, fi] = await Promise.all([
        fetch(`/api/folders?${params}`).then((r) => r.json()),
        fetch(`/api/files?search=${encodeURIComponent(search)}`).then((r) => r.json()),
      ]);
      setFolders(fl); setFiles(fi);
    } else {
      const fParams = new URLSearchParams();
      if (currentFolderId) fParams.set("parentId", currentFolderId);
      else fParams.set("parentId", "null"); // explicit null root

      const fileParams = new URLSearchParams();
      fileParams.set("folderId", currentFolderId ?? "null");

      const [fl, fi] = await Promise.all([
        fetch(`/api/folders?${fParams}`).then((r) => r.json()),
        fetch(`/api/files?${fileParams}`).then((r) => r.json()),
      ]);
      setFolders(fl); setFiles(fi);
    }
    setLoading(false);
  }, [currentFolderId, search]);

  useEffect(() => { load(); }, [load]);

  function navigateInto(folder: FolderItem) {
    setCrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setSearch("");
  }

  function navigateTo(index: number) {
    setCrumbs((prev) => prev.slice(0, index + 1));
    setSearch("");
  }

  async function createFolder() {
    if (!newFolderName.trim()) return;
    setSavingFolder(true);
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFolderName, parentId: currentFolderId }),
    });
    const data = await res.json();
    setSavingFolder(false);
    if (res.ok) {
      setFolders((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setCreatingFolder(false);
      setNewFolderName("");
    }
  }

  async function renameFolder(id: string, name: string) {
    const res = await fetch(`/api/folders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const data = await res.json();
      setFolders((prev) => prev.map((f) => f.id === id ? data : f));
    }
    setRenaming(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const url = deleteTarget.type === "folder" ? `/api/folders/${deleteTarget.id}` : `/api/files/${deleteTarget.id}`;
    const res = await fetch(url, { method: "DELETE" });
    const data = await res.json();
    setDeleting(false);
    if (!res.ok) { alert(data.error); return; }
    if (deleteTarget.type === "folder") setFolders((prev) => prev.filter((f) => f.id !== deleteTarget.id));
    else setFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id));
    setDeleteTarget(null);
    setContextMenu(null);
  }

  async function downloadFile(file: FileItem) {
    const res = await fetch(`/api/files/${file.id}`);
    const { downloadUrl } = await res.json();
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = file.name;
    a.click();
  }

  async function uploadFiles(fileList: FileList) {
    setUploading(true);
    const results: FileItem[] = [];

    for (const file of Array.from(fileList)) {
      setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

      // Get presigned PUT URL
      const presignRes = await fetch("/api/files/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, mimeType: file.type || "application/octet-stream" }),
      });
      const { uploadUrl, fileUrl } = await presignRes.json();

      // Upload directly to S3 via PUT
      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      setUploadProgress((prev) => ({ ...prev, [file.name]: 50 }));

      // Create DB record
      const dbRes = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          url: fileUrl,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
          folderId: currentFolderId,
        }),
      });
      const created = await dbRes.json();
      if (dbRes.ok) results.push(created);
      setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
    }

    setFiles((prev) => [...results, ...prev]);
    setUploading(false);
    setTimeout(() => setUploadProgress({}), 1500);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }

  function startRename(type: "folder" | "file", id: string, name: string) {
    setRenaming({ type, id, name });
    setRenameValue(name);
    setContextMenu(null);
  }

  const userId = session?.user?.id ?? "";
  const userRole = session?.user?.role ?? "";
  const canManage = (ownerId: string) => ownerId === userId || ["admin", "hr"].includes(userRole);

  const isEmpty = folders.length === 0 && files.length === 0;

  return (
    <div
      className={`relative transition-colors ${dragOver ? "bg-blue-50" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      onClick={() => setContextMenu(null)}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Files</h1>
          <p className="text-sm text-slate-500 mt-0.5">Team documents and shared assets</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setCreatingFolder(true); setNewFolderName(""); }}
            className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={14} /> New Folder
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Upload size={14} /> {uploading ? "Uploading…" : "Upload"}
          </button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 flex-1 min-w-0">
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1 shrink-0">
              {i > 0 && <ChevronRight size={12} className="text-slate-300" />}
              <button
                onClick={() => navigateTo(i)}
                className={`flex items-center gap-1 text-sm rounded px-1.5 py-0.5 transition-colors ${
                  i === crumbs.length - 1 ? "font-semibold text-slate-900 cursor-default" : "text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                {i === 0 && <Home size={12} />}
                {crumb.name}
              </button>
            </span>
          ))}
        </nav>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 w-56">
          <Search size={13} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search files…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm bg-transparent focus:outline-none flex-1 text-slate-700 placeholder:text-slate-400"
          />
          {search && <button onClick={() => setSearch("")}><X size={12} className="text-slate-400" /></button>}
        </div>

        {/* View toggle */}
        <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
          <button onClick={() => setView("grid")} className={`p-1.5 ${view === "grid" ? "bg-slate-100 text-slate-700" : "text-slate-400 hover:text-slate-600"}`}><Grid3X3 size={15} /></button>
          <button onClick={() => setView("list")} className={`p-1.5 ${view === "list" ? "bg-slate-100 text-slate-700" : "text-slate-400 hover:text-slate-600"}`}><List size={15} /></button>
        </div>
      </div>

      {/* Upload progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="mb-4 space-y-1.5">
          {Object.entries(uploadProgress).map(([name, pct]) => (
            <div key={name} className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-blue-800 truncate">{name}</p>
                <div className="mt-1 h-1 bg-blue-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-blue-500 rounded-full transition-all ${pct === 100 ? "bg-green-500" : ""}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
              <span className="text-xs text-blue-600 shrink-0">{pct === 100 ? "Done" : `${pct}%`}</span>
            </div>
          ))}
        </div>
      )}

      {/* New folder input */}
      {creatingFolder && (
        <div className="mb-4 flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
          <Folder size={16} className="text-yellow-500 shrink-0" />
          <input
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") createFolder(); if (e.key === "Escape") { setCreatingFolder(false); } }}
            placeholder="Folder name"
            className="flex-1 text-sm bg-transparent focus:outline-none text-slate-800 placeholder:text-slate-400"
          />
          <button onClick={createFolder} disabled={savingFolder || !newFolderName.trim()} className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"><Check size={15} /></button>
          <button onClick={() => setCreatingFolder(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X size={15} /></button>
        </div>
      )}

      {/* Drop overlay */}
      {dragOver && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-blue-50/80 border-2 border-dashed border-blue-400 rounded-2xl pointer-events-none">
          <div className="text-center">
            <Upload size={36} className="text-blue-500 mx-auto mb-2" />
            <p className="text-blue-700 font-semibold">Drop files to upload</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Folders */}
          {folders.length > 0 && (
            <section className="mb-6">
              {!search && <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Folders</p>}
              <div className={view === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3" : "space-y-1"}>
                {folders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    view={view}
                    renaming={renaming}
                    renameValue={renameValue}
                    setRenameValue={setRenameValue}
                    onOpen={() => navigateInto(folder)}
                    onRenameSubmit={() => renameFolder(folder.id, renameValue)}
                    onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, item: folder, type: "folder" }); }}
                    canManage={canManage(folder.createdBy.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Files */}
          {files.length > 0 && (
            <section>
              {!search && <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Files</p>}
              {view === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {files.map((file) => (
                    <FileCard
                      key={file.id}
                      file={file}
                      renaming={renaming}
                      renameValue={renameValue}
                      setRenameValue={setRenameValue}
                      onRenameSubmit={() => setRenaming(null)}
                      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, item: file, type: "file" }); }}
                      onDownload={() => downloadFile(file)}
                      canManage={canManage(file.uploadedBy.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="hidden md:grid grid-cols-12 px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                    <div className="col-span-6 text-xs font-semibold text-slate-400 uppercase tracking-wide">Name</div>
                    <div className="col-span-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">Type</div>
                    <div className="col-span-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">Size</div>
                    <div className="col-span-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">Uploaded</div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {files.map((file) => (
                      <FileRow
                        key={file.id}
                        file={file}
                        onDownload={() => downloadFile(file)}
                        onDelete={() => setDeleteTarget({ type: "file", id: file.id, name: file.name })}
                        canManage={canManage(file.uploadedBy.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Empty state */}
          {isEmpty && !creatingFolder && (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <FolderOpen size={48} className="mb-3 opacity-25" />
              <p className="font-semibold text-slate-600 text-base">
                {search ? "No files match your search" : "This folder is empty"}
              </p>
              {!search && (
                <p className="text-sm mt-1 mb-5">Upload files or create a folder to get started</p>
              )}
              {!search && (
                <div className="flex gap-2">
                  <button onClick={() => { setCreatingFolder(true); setNewFolderName(""); }} className="flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium">
                    <Plus size={13} /> New Folder
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium">
                    <Upload size={13} /> Upload File
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-44"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === "file" && (
            <button onClick={() => { downloadFile(contextMenu.item as FileItem); setContextMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <Download size={13} /> Download
            </button>
          )}
          {canManage((contextMenu.item as FolderItem).createdBy?.id ?? (contextMenu.item as FileItem).uploadedBy?.id) && (
            <>
              <button onClick={() => startRename(contextMenu.type, contextMenu.item.id, contextMenu.item.name)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <Pencil size={13} /> Rename
              </button>
              <div className="border-t border-slate-100 my-1" />
              <button onClick={() => { setDeleteTarget({ type: contextMenu.type, id: contextMenu.item.id, name: contextMenu.item.name }); setContextMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                <Trash2 size={13} /> Delete
              </button>
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleteTarget?.type === "folder" ? "Folder" : "File"}`}
        description={`Delete "${deleteTarget?.name}"?${deleteTarget?.type === "folder" ? " The folder must be empty." : " This cannot be undone."}`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FolderCard({ folder, view, renaming, renameValue, setRenameValue, onOpen, onRenameSubmit, onContextMenu, canManage }: {
  folder: FolderItem; view: string;
  renaming: { type: string; id: string } | null;
  renameValue: string; setRenameValue: (v: string) => void;
  onOpen: () => void; onRenameSubmit: () => void;
  onContextMenu: (e: React.MouseEvent) => void; canManage: boolean;
}) {
  const isRenaming = renaming?.type === "folder" && renaming.id === folder.id;

  if (view === "list") {
    return (
      <div
        onDoubleClick={onOpen}
        onContextMenu={onContextMenu}
        className="flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group"
      >
        <Folder size={18} className="text-yellow-400 shrink-0" />
        {isRenaming ? (
          <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onRenameSubmit(); if (e.key === "Escape") setRenameValue(folder.name); }}
            onBlur={onRenameSubmit}
            className="flex-1 text-sm bg-white border border-blue-300 rounded px-1.5 focus:outline-none"
            onClick={(e) => e.stopPropagation()} />
        ) : (
          <span className="flex-1 text-sm font-medium text-slate-800 truncate">{folder.name}</span>
        )}
        <span className="text-xs text-slate-400">{folder._count.files + folder._count.children} items</span>
      </div>
    );
  }

  return (
    <div
      onDoubleClick={onOpen}
      onContextMenu={onContextMenu}
      className="bg-white border border-slate-200 rounded-xl p-3 hover:shadow-sm cursor-pointer transition-shadow group select-none"
    >
      <div className="flex items-start justify-between mb-2">
        <Folder size={28} className="text-yellow-400" />
        <button
          onClick={(e) => { e.stopPropagation(); onContextMenu(e); }}
          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-all"
        >
          <MoreHorizontal size={13} />
        </button>
      </div>
      {isRenaming ? (
        <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onRenameSubmit(); if (e.key === "Escape") setRenameValue(folder.name); }}
          onBlur={onRenameSubmit}
          className="w-full text-xs bg-white border border-blue-300 rounded px-1.5 focus:outline-none"
          onClick={(e) => e.stopPropagation()} />
      ) : (
        <p className="text-xs font-semibold text-slate-800 truncate">{folder.name}</p>
      )}
      <p className="text-xs text-slate-400 mt-0.5">{folder._count.files + folder._count.children} items</p>
    </div>
  );
}

function FileCard({ file, renaming, renameValue, setRenameValue, onRenameSubmit, onContextMenu, onDownload, canManage }: {
  file: FileItem;
  renaming: { type: string; id: string } | null;
  renameValue: string; setRenameValue: (v: string) => void;
  onRenameSubmit: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDownload: () => void; canManage: boolean;
}) {
  const isRenaming = renaming?.type === "file" && renaming.id === file.id;
  const isImage = file.mimeType.startsWith("image/");

  return (
    <div
      onDoubleClick={onDownload}
      onContextMenu={onContextMenu}
      className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-sm cursor-pointer transition-shadow group select-none"
    >
      {/* Thumbnail */}
      <div className="h-20 bg-slate-50 flex items-center justify-center relative">
        {isImage ? (
          <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
        ) : (
          <FileIcon mimeType={file.mimeType} size={28} />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onContextMenu(e); }}
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 bg-white/80 text-slate-500 rounded hover:bg-white transition-all"
        >
          <MoreHorizontal size={13} />
        </button>
      </div>
      <div className="p-2.5">
        {isRenaming ? (
          <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onRenameSubmit(); if (e.key === "Escape") setRenameValue(file.name); }}
            onBlur={onRenameSubmit}
            className="w-full text-xs bg-white border border-blue-300 rounded px-1 focus:outline-none"
            onClick={(e) => e.stopPropagation()} />
        ) : (
          <p className="text-xs font-semibold text-slate-800 truncate">{file.name}</p>
        )}
        <p className="text-xs text-slate-400 mt-0.5">{formatBytes(file.size)}</p>
      </div>
    </div>
  );
}

function FileRow({ file, onDownload, onDelete, canManage }: {
  file: FileItem; onDownload: () => void; onDelete: () => void; canManage: boolean;
}) {
  return (
    <div className="grid grid-cols-12 px-4 py-3 items-center hover:bg-slate-50 group">
      <div className="col-span-6 flex items-center gap-3">
        <FileIcon mimeType={file.mimeType} size={18} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Avatar name={file.uploadedBy.name} src={file.uploadedBy.avatar} size="xs" />
            <span className="text-xs text-slate-400">{file.uploadedBy.name}</span>
          </div>
        </div>
      </div>
      <div className="hidden md:block col-span-2 text-xs text-slate-500">{mimeLabel(file.mimeType)}</div>
      <div className="hidden md:block col-span-2 text-xs text-slate-500">{formatBytes(file.size)}</div>
      <div className="hidden md:block col-span-2 text-xs text-slate-400">{formatDate(file.createdAt)}</div>
      <div className="hidden group-hover:flex col-span-12 md:col-span-0 absolute right-4 items-center gap-1">
        <button onClick={onDownload} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Download size={13} /></button>
        {canManage && <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>}
      </div>
    </div>
  );
}
