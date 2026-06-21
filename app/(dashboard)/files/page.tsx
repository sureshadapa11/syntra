import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { FileText, Folder, Upload } from "lucide-react";

export default async function FilesPage() {
  const folders = await prisma.folder.findMany({
    where: { parentId: null },
    include: { _count: { select: { files: true, children: true } } },
  });
  const files = await prisma.file.findMany({
    where: { folderId: null },
    include: { uploadedBy: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Files</h1>
          <p className="text-slate-500 mt-1">Team documents and assets</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium">
            <Folder size={16} />
            New Folder
          </button>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Upload size={16} />
            Upload
          </button>
        </div>
      </div>

      {folders.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wide">Folders</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {folders.map((folder) => (
              <div key={folder.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm cursor-pointer transition-shadow group">
                <Folder size={32} className="text-yellow-400 mb-2" />
                <p className="text-sm font-medium text-slate-800 truncate">{folder.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {folder._count.files} files
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wide">Files</h2>
        <div className="bg-white rounded-xl border border-slate-200">
          {files.length === 0 && folders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <FileText size={48} className="mb-3 opacity-40" />
              <p className="font-medium">No files yet</p>
              <p className="text-sm mt-1">Upload your first file</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {files.map((file) => (
                <div key={file.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50">
                  <FileText size={20} className="text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-400">{file.uploadedBy.name} · {formatDate(file.createdAt)}</p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
