import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { FolderKanban, Plus, Users } from "lucide-react";
import Link from "next/link";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    include: {
      members: true,
      _count: { select: { tasks: true, sprints: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
          <p className="text-slate-500 mt-1">{projects.length} projects</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} />
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center py-20">
          <FolderKanban size={48} className="text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">No projects yet</p>
          <p className="text-sm text-slate-400 mt-1">Create your first project to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}/board`}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {project.key}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  project.status === "active"
                    ? "bg-green-50 text-green-700"
                    : "bg-slate-100 text-slate-600"
                }`}>
                  {project.status}
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{project.description}</p>
              )}
              <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {project.members.length} members
                </span>
                <span>{project._count.tasks} tasks</span>
                <span className="capitalize">{project.type}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
