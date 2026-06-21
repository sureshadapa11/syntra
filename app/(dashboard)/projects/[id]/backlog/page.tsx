"use client";

import { useState, useEffect } from "react";
import { BacklogView } from "@/components/projects/backlog-view";

interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  _count: { tasks: number };
}

export default function BacklogPage({ params }: { params: Promise<{ id: string }> }) {
  const [projectId, setProjectId] = useState("");
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [backlogTasks, setBacklogTasks] = useState<any[]>([]);
  const [sprintTasks, setSprintTasks] = useState<Record<string, any[]>>({});
  const [epics, setEpics] = useState<any[]>([]);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(async ({ id }) => {
      setProjectId(id);

      const [sprintData, epicData, memberData, backlog] = await Promise.all([
        fetch(`/api/projects/${id}/sprints`).then((r) => r.json()),
        fetch(`/api/projects/${id}/epics`).then((r) => r.json()),
        fetch(`/api/projects/${id}/members`).then((r) => r.json()),
        fetch(`/api/tasks?projectId=${id}&sprintId=null`).then((r) => r.json()),
      ]);

      setSprints(sprintData);
      setEpics(epicData);
      setMembers(memberData.map((m: any) => ({ id: m.user.id, name: m.user.name })));
      setBacklogTasks(backlog);

      // Load tasks for each non-completed sprint
      const activeSprints = sprintData.filter((s: Sprint) => s.status !== "completed");
      const sprintTaskMap: Record<string, any[]> = {};
      await Promise.all(
        activeSprints.map(async (s: Sprint) => {
          const tasks = await fetch(`/api/tasks?projectId=${id}&sprintId=${s.id}`).then((r) => r.json());
          sprintTaskMap[s.id] = tasks;
        })
      );
      setSprintTasks(sprintTaskMap);
      setLoading(false);
    });
  }, []);

  if (loading || !projectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Backlog</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage and prioritize issues across sprints. Drag tasks or use the sprint selector when creating.
        </p>
      </div>
      <BacklogView
        projectId={projectId}
        sprints={sprints}
        backlogTasks={backlogTasks}
        sprintTasks={sprintTasks}
        members={members}
        epics={epics}
        onTasksChange={(bl, st) => { setBacklogTasks(bl); setSprintTasks(st); }}
        onSprintsChange={setSprints}
      />
    </div>
  );
}
