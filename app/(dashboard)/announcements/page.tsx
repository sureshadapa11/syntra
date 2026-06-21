import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { Megaphone, Plus, Pin } from "lucide-react";
import { getInitials } from "@/lib/utils";

export default async function AnnouncementsPage() {
  const announcements = await prisma.announcement.findMany({
    include: { createdBy: true, department: true },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Announcements</h1>
          <p className="text-slate-500 mt-1">Company news and updates</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} />
          Post Announcement
        </button>
      </div>

      <div className="space-y-4 max-w-3xl">
        {announcements.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center py-20">
            <Megaphone size={48} className="text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">No announcements yet</p>
          </div>
        ) : (
          announcements.map((ann) => (
            <div key={ann.id} className={`bg-white rounded-xl border p-5 ${ann.pinned ? "border-blue-300 bg-blue-50/30" : "border-slate-200"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {ann.pinned && <Pin size={13} className="text-blue-600" />}
                    <h3 className="font-semibold text-slate-900">{ann.title}</h3>
                    {ann.department && (
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {ann.department.name}
                      </span>
                    )}
                    {!ann.department && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Company-wide
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{ann.content}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
                <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs">
                  {getInitials(ann.createdBy.name)}
                </div>
                <span>{ann.createdBy.name}</span>
                <span>·</span>
                <span>{formatDateTime(ann.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
