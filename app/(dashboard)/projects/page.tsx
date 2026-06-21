"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { CreateProjectForm } from "@/components/projects/create-project-form";
import { FolderKanban, Plus, Users, CheckSquare, Search, Layers } from "lucide-react";

interface Project {
  id: string;
  name: string;
  key: string;
  description: string | null;
  type: string;
  status: string;
  lead: { id: string; name: string; avatar: string | null } | null;
  members: Array<{ user: { id: string; name: string; avatar: string | null } }>;
  _count: { tasks: number; sprints: number };
}

const projectColors = [
  "bg-blue-600", "bg-purple-600", "bg-green-600", "bg-orange-600",
  "bg-pink-600", "bg-teal-600", "bg-indigo-600", "bg-red-600",
];

function getProjectColor(key: string) {
  let hash = 0;
  for (const c of key) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return projectColors[Math.abs(hash) % projectColors.length];
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => { setProjects(d); setLoading(false); });
  }, []);

  const filtered = projects.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.key.toLowerCase().includes(search.toLowerCase())
  );

  function handleCreated(project: Project) {
    setProjects((prev) => [project, ...prev]);
    setShowCreate(false);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500 mt-1">{projects.length} active project{projects.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
            <Search size={14} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm bg-transparent focus:outline-none text-slate-700 w-40 placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={15} /> New Project
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center py-20">
          <FolderKanban size={48} className="text-slate-300 mb-3" />
          <p className="text-slate-600 font-semibold">
            {search ? "No projects match your search" : "No projects yet"}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {!search && "Create your first project to start tracking work"}
          </p>
          {!search && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={15} /> New Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}/board`}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-blue-200 transition-all group block"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${getProjectColor(project.key)} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                  {project.key}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                    project.type === "scrum" ? "bg-blue-50 text-blue-600" : "bg-teal-50 text-teal-600"
                  }`}>
                    {project.type}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    project.status === "active" ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"
                  }`}>
                    {project.status}
                  </span>
                </div>
              </div>

              <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{project.description}</p>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <CheckSquare size={12} />
                    {project._count.tasks} tasks
                  </span>
                  {project.type === "scrum" && (
                    <span className="flex items-center gap-1">
                      <Layers size={12} />
                      {project._count.sprints} sprints
                    </span>
                  )}
                </div>
                <div className="flex items-center -space-x-2">
                  {project.members.slice(0, 5).map((m) => (
                    <Avatar key={m.user.id} name={m.user.name} src={m.user.avatar} size="xs" className="ring-2 ring-white" />
                  ))}
                  {project.members.length > 5 && (
                    <div className="w-6 h-6 rounded-full bg-slate-200 ring-2 ring-white flex items-center justify-center text-xs text-slate-600 font-medium">
                      +{project.members.length - 5}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Project" size="lg">
        <CreateProjectForm onSuccess={handleCreated} onCancel={() => setShowCreate(false)} />
      </Modal>
    </div>
  );
}
