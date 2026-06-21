import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProjectTabs } from "@/components/projects/project-tabs";

const projectColors = [
  "bg-blue-600", "bg-purple-600", "bg-green-600", "bg-orange-600",
  "bg-pink-600", "bg-teal-600", "bg-indigo-600", "bg-red-600",
];

function getProjectColor(key: string) {
  let hash = 0;
  for (const c of key) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return projectColors[Math.abs(hash) % projectColors.length];
}

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, name: true, key: true, type: true, status: true },
  });

  if (!project) redirect("/projects");

  const colorClass = getProjectColor(project.key);

  return (
    <div className="flex flex-col h-full">
      {/* Project header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/projects" className="text-slate-400 hover:text-slate-600 transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <div className={`w-7 h-7 rounded-lg ${colorClass} flex items-center justify-center text-white font-bold text-xs`}>
              {project.key}
            </div>
            <h1 className="font-semibold text-slate-900">{project.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
              project.type === "scrum" ? "bg-blue-50 text-blue-600" : "bg-teal-50 text-teal-600"
            }`}>
              {project.type}
            </span>
          </div>

          {/* Tabs */}
          <ProjectTabs projectId={id} />
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50">
        {children}
      </div>
    </div>
  );
}
