"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { KanbanBoard } from "@/components/projects/kanban-board";
import { SprintManager } from "@/components/projects/sprint-manager";
import { Modal } from "@/components/ui/modal";
import { CreateTaskForm } from "@/components/projects/create-task-form";
import { Plus, Filter, RefreshCw } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  _count: { tasks: number };
}

interface Epic { id: string; name: string; color: string; }
interface Member { id: string; name: string; avatar: string | null; user: { id: string; name: string; avatar: string | null } }

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession();
  const [projectId, setProjectId] = useState("");
  const [projectType, setProjectType] = useState("scrum");
  const [tasks, setTasks] = useState<any[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSprint, setSelectedSprint] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterEpic, setFilterEpic] = useState("");

  useEffect(() => {
    params.then(({ id }) => {
      setProjectId(id);
      loadData(id);
    });
  }, []);

  async function loadData(id: string) {
    setLoading(true);
    const [proj, sprintData, epicData, memberData] = await Promise.all([
      fetch(`/api/projects/${id}`).then((r) => r.json()),
      fetch(`/api/projects/${id}/sprints`).then((r) => r.json()),
      fetch(`/api/projects/${id}/epics`).then((r) => r.json()),
      fetch(`/api/projects/${id}/members`).then((r) => r.json()),
    ]);

    setProjectType(proj.type);
    setSprints(sprintData);
    setEpics(epicData);
    setMembers(memberData.map((m: any) => ({ id: m.user.id, name: m.user.name, avatar: m.user.avatar })));

    // For kanban, no sprint concept — load all tasks
    const tasksRes = await fetch(`/api/tasks?projectId=${id}`);
    const allTasks = await tasksRes.json();
    setTasks(allTasks);

    // Auto-select active sprint
    const active = sprintData.find((s: Sprint) => s.status === "active");
    if (active) setSelectedSprint(active.id);

    setLoading(false);
  }

  const filteredTasks = tasks.filter((t) => {
    if (projectType === "scrum") {
      if (selectedSprint && t.sprintId !== selectedSprint) return false;
      if (!selectedSprint && sprints.length > 0) {
        // Show all non-completed tasks not in a specific sprint
      }
    }
    if (filterAssignee && t.assignee?.id !== filterAssignee) return false;
    if (filterEpic && t.epic?.id !== filterEpic) return false;
    return true;
  });

  function handleNewTask(task: any) {
    setTasks((prev) => [...prev, task]);
    setShowCreate(false);
  }

  if (loading || !projectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeSprint = sprints.find((s) => s.status === "active") ?? null;

  return (
    <div className="p-4 max-w-[1400px] mx-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          {projectType === "scrum" && (
            <SprintManager
              projectId={projectId}
              sprints={sprints}
              activeSprint={activeSprint}
              selectedSprintId={selectedSprint}
              onSprintSelect={setSelectedSprint}
              onSprintsChange={setSprints}
            />
          )}

          {/* Filters */}
          <div className="flex items-center gap-2">
            {members.length > 0 && (
              <div className="flex items-center -space-x-1">
                {members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setFilterAssignee(filterAssignee === m.id ? "" : m.id)}
                    title={m.name}
                    className={`rounded-full ring-2 transition-all ${
                      filterAssignee === m.id ? "ring-blue-500 scale-110" : "ring-white hover:ring-slate-300"
                    }`}
                  >
                    <Avatar name={m.name} src={(m as any).avatar} size="xs" />
                  </button>
                ))}
              </div>
            )}

            {epics.length > 0 && (
              <select
                value={filterEpic}
                onChange={(e) => setFilterEpic(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 focus:outline-none bg-white"
              >
                <option value="">All Epics</option>
                {epics.map((ep) => (
                  <option key={ep.id} value={ep.id}>{ep.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shrink-0"
        >
          <Plus size={14} /> Create
        </button>
      </div>

      {/* Board */}
      <KanbanBoard
        tasks={filteredTasks}
        projectId={projectId}
        sprintId={selectedSprint}
        members={members}
        epics={epics}
        sprints={sprints}
        onTasksChange={setTasks}
      />

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Task" size="lg">
        <CreateTaskForm
          projectId={projectId}
          sprintId={selectedSprint}
          members={members}
          epics={epics}
          sprints={sprints}
          onSuccess={handleNewTask}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>
    </div>
  );
}
