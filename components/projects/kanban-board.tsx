"use client";

import { useState, useCallback } from "react";
import { TaskCard, TaskCardData } from "./task-card";
import { TaskDetailModal } from "./task-detail-modal";
import { Modal } from "@/components/ui/modal";
import { CreateTaskForm } from "./create-task-form";
import { Plus } from "lucide-react";

const COLUMNS = [
  { id: "todo", label: "To Do", color: "bg-slate-400" },
  { id: "in-progress", label: "In Progress", color: "bg-blue-500" },
  { id: "review", label: "Review", color: "bg-amber-400" },
  { id: "done", label: "Done", color: "bg-green-500" },
] as const;

interface Member { id: string; name: string; }
interface Epic { id: string; name: string; color: string; }
interface Sprint { id: string; name: string; status: string; }

interface KanbanBoardProps {
  tasks: TaskCardData[];
  projectId: string;
  sprintId?: string | null;
  members: Member[];
  epics: Epic[];
  sprints?: Sprint[];
  onTasksChange: (tasks: TaskCardData[]) => void;
}

export function KanbanBoard({ tasks, projectId, sprintId, members, epics, sprints, onTasksChange }: KanbanBoardProps) {
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [addColumn, setAddColumn] = useState<string | null>(null);

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter((t) => t.status === col.id);
    return acc;
  }, {} as Record<string, TaskCardData[]>);

  function handleDragStart(e: React.DragEvent, taskId: string) {
    setDragTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, colId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(colId);
  }

  async function handleDrop(e: React.DragEvent, newStatus: string) {
    e.preventDefault();
    setDragOver(null);
    if (!dragTaskId) return;

    const task = tasks.find((t) => t.id === dragTaskId);
    if (!task || task.status === newStatus) { setDragTaskId(null); return; }

    // Optimistic update
    onTasksChange(tasks.map((t) => t.id === dragTaskId ? { ...t, status: newStatus } : t));

    await fetch(`/api/tasks/${dragTaskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    setDragTaskId(null);
  }

  function handleTaskUpdate(updated: any) {
    onTasksChange(tasks.map((t) => t.id === updated.id ? { ...t, ...updated } : t));
  }

  function handleTaskDelete(id: string) {
    onTasksChange(tasks.filter((t) => t.id !== id));
  }

  function handleNewTask(task: any) {
    onTasksChange([...tasks, task]);
    setAddColumn(null);
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-280px)]">
        {COLUMNS.map((col) => {
          const colTasks = grouped[col.id] ?? [];
          const isDragTarget = dragOver === col.id;
          const totalPoints = colTasks.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);

          return (
            <div
              key={col.id}
              className={`flex flex-col w-72 shrink-0 rounded-xl border-2 transition-all ${
                isDragTarget ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-slate-50"
              }`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column header */}
              <div className="px-3 py-3 flex items-center justify-between sticky top-0 bg-inherit rounded-t-xl">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                  <span className="text-sm font-semibold text-slate-700">{col.label}</span>
                  <span className="text-xs font-medium text-slate-400 bg-slate-200 w-5 h-5 rounded-full flex items-center justify-center">
                    {colTasks.length}
                  </span>
                </div>
                {totalPoints > 0 && (
                  <span className="text-xs text-slate-400">{totalPoints} pts</span>
                )}
              </div>

              {/* Cards */}
              <div className="flex-1 px-2 pb-2 space-y-2 min-h-[60px]">
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => setSelectedTaskId(task.id)}
                    onDragStart={(e) => handleDragStart(e, task.id)}
                  />
                ))}
              </div>

              {/* Add task button */}
              <div className="px-2 pb-2">
                <button
                  onClick={() => setAddColumn(col.id)}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Plus size={13} /> Add task
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          members={members}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
        />
      )}

      <Modal
        open={!!addColumn}
        onClose={() => setAddColumn(null)}
        title="Create Task"
        size="lg"
      >
        <CreateTaskForm
          projectId={projectId}
          sprintId={sprintId}
          members={members}
          epics={epics}
          sprints={sprints}
          defaultStatus={addColumn ?? "todo"}
          onSuccess={handleNewTask}
          onCancel={() => setAddColumn(null)}
        />
      </Modal>
    </>
  );
}
