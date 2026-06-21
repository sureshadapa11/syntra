"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { CreateTaskForm } from "./create-task-form";
import { TaskDetailModal } from "./task-detail-modal";
import { formatDate } from "@/lib/utils";
import {
  BookOpen, CheckSquare, Bug, GitBranch, AlertCircle, ArrowUp, Minus, ArrowDown,
  ChevronDown, ChevronRight, Plus, Send
} from "lucide-react";

interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  _count: { tasks: number };
}

interface Task {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  storyPoints: number | null;
  dueDate: string | null;
  assignee: { id: string; name: string; avatar: string | null } | null;
  epic: { id: string; name: string; color: string } | null;
  sprint: { id: string; name: string } | null;
  _count: { comments: number; subtasks: number };
}

interface Member { id: string; name: string; }
interface Epic { id: string; name: string; color: string; }

interface BacklogViewProps {
  projectId: string;
  sprints: Sprint[];
  backlogTasks: Task[];
  sprintTasks: Record<string, Task[]>;
  members: Member[];
  epics: Epic[];
  onTasksChange: (backlog: Task[], sprintTasks: Record<string, Task[]>) => void;
  onSprintsChange: (sprints: Sprint[]) => void;
}

const typeIcons: Record<string, React.ElementType> = {
  story: BookOpen, task: CheckSquare, bug: Bug, subtask: GitBranch,
};
const typeColors: Record<string, string> = {
  story: "text-green-600", task: "text-blue-600", bug: "text-red-600", subtask: "text-slate-500",
};
const priorityIcons: Record<string, React.ElementType> = {
  critical: AlertCircle, high: ArrowUp, medium: Minus, low: ArrowDown,
};
const priorityColors: Record<string, string> = {
  critical: "text-red-600", high: "text-orange-500", medium: "text-amber-500", low: "text-slate-400",
};

const statusVariant: Record<string, any> = {
  todo: "default", "in-progress": "info", review: "warning", done: "success",
};

function TaskRow({ task, onClick }: { task: Task; onClick: () => void }) {
  const TypeIcon = typeIcons[task.type] ?? CheckSquare;
  const PriorityIcon = priorityIcons[task.priority] ?? Minus;

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
    >
      <TypeIcon size={14} className={typeColors[task.type] ?? "text-slate-500"} />
      <PriorityIcon size={13} className={priorityColors[task.priority] ?? "text-slate-400"} />

      <span className="flex-1 text-sm text-slate-800 truncate">{task.title}</span>

      {task.epic && (
        <span
          className="text-xs font-medium px-1.5 py-0.5 rounded shrink-0 hidden sm:block"
          style={{ backgroundColor: task.epic.color + "22", color: task.epic.color }}
        >
          {task.epic.name}
        </span>
      )}

      <Badge variant={statusVariant[task.status] ?? "default"} className="capitalize shrink-0 text-xs">
        {task.status.replace("-", " ")}
      </Badge>

      {task.storyPoints !== null && (
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 w-5 h-5 flex items-center justify-center rounded shrink-0">
          {task.storyPoints}
        </span>
      )}

      {task.assignee ? (
        <Avatar name={task.assignee.name} src={task.assignee.avatar} size="xs" />
      ) : (
        <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-300 shrink-0" />
      )}
    </div>
  );
}

interface SprintSectionProps {
  sprint: Sprint;
  tasks: Task[];
  projectId: string;
  members: Member[];
  epics: Epic[];
  onAddTask: (task: Task) => void;
  onTaskClick: (id: string) => void;
  onMoveToSprint: (taskId: string, sprintId: string) => void;
}

function SprintSection({
  sprint, tasks, projectId, members, epics, onAddTask, onTaskClick,
}: SprintSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const totalPoints = tasks.reduce((s, t) => s + (t.storyPoints ?? 0), 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 select-none"
        onClick={() => setCollapsed((v) => !v)}
      >
        {collapsed ? <ChevronRight size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-900">{sprint.name}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
              sprint.status === "active" ? "bg-green-100 text-green-700" :
              sprint.status === "planning" ? "bg-slate-100 text-slate-600" :
              "bg-purple-100 text-purple-700"
            }`}>
              {sprint.status}
            </span>
            {sprint.startDate && sprint.endDate && (
              <span className="text-xs text-slate-400">{formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}</span>
            )}
          </div>
          {sprint.goal && <p className="text-xs text-slate-400 mt-0.5">{sprint.goal}</p>}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
          <span>{doneCount}/{tasks.length} done</span>
          {totalPoints > 0 && <span>{totalPoints} pts</span>}
        </div>
      </div>

      {!collapsed && (
        <>
          {tasks.length > 0 ? (
            <div className="border-t border-slate-100">
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
              ))}
            </div>
          ) : (
            <div className="px-4 py-4 text-xs text-slate-400 border-t border-slate-100">
              No tasks in this sprint yet.
            </div>
          )}
          <div className="px-4 py-2 border-t border-slate-50">
            <button
              onClick={(e) => { e.stopPropagation(); setShowAdd(true); }}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-600 transition-colors"
            >
              <Plus size={13} /> Add task
            </button>
          </div>
        </>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Task to Sprint" size="lg">
        <CreateTaskForm
          projectId={projectId}
          sprintId={sprint.id}
          members={members}
          epics={epics}
          onSuccess={(t) => { onAddTask(t); setShowAdd(false); }}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>
    </div>
  );
}

export function BacklogView({
  projectId, sprints, backlogTasks, sprintTasks, members, epics, onTasksChange, onSprintsChange,
}: BacklogViewProps) {
  const [showAddBacklog, setShowAddBacklog] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  function handleBacklogAdd(task: Task) {
    onTasksChange([...backlogTasks, task as any], sprintTasks);
    setShowAddBacklog(false);
  }

  function handleSprintAdd(sprintId: string, task: Task) {
    const updated = { ...sprintTasks, [sprintId]: [...(sprintTasks[sprintId] ?? []), task as any] };
    onTasksChange(backlogTasks, updated);
  }

  function handleTaskUpdate(updated: any) {
    const newBacklog = backlogTasks.map((t) => t.id === updated.id ? { ...t, ...updated } : t);
    const newSprintTasks = Object.fromEntries(
      Object.entries(sprintTasks).map(([sid, tasks]) => [
        sid,
        tasks.map((t) => t.id === updated.id ? { ...t, ...updated } : t),
      ])
    );
    onTasksChange(newBacklog, newSprintTasks);
  }

  function handleTaskDelete(id: string) {
    const newBacklog = backlogTasks.filter((t) => t.id !== id);
    const newSprintTasks = Object.fromEntries(
      Object.entries(sprintTasks).map(([sid, tasks]) => [sid, tasks.filter((t) => t.id !== id)])
    );
    onTasksChange(newBacklog, newSprintTasks);
  }

  const activeSprints = sprints.filter((s) => s.status !== "completed");

  return (
    <>
      <div className="space-y-4">
        {/* Sprint sections */}
        {activeSprints.map((sprint) => (
          <SprintSection
            key={sprint.id}
            sprint={sprint}
            tasks={sprintTasks[sprint.id] ?? []}
            projectId={projectId}
            members={members}
            epics={epics}
            onAddTask={(t) => handleSprintAdd(sprint.id, t)}
            onTaskClick={setSelectedTaskId}
            onMoveToSprint={() => {}}
          />
        ))}

        {/* Backlog section */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div>
              <span className="text-sm font-semibold text-slate-900">Backlog</span>
              <span className="ml-2 text-xs text-slate-400">{backlogTasks.length} issues</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowAddBacklog(true)}>
              <Plus size={13} /> Add to Backlog
            </Button>
          </div>

          {backlogTasks.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              Backlog is empty — all tasks are in sprints or completed.
            </div>
          ) : (
            <div>
              {backlogTasks.map((task) => (
                <TaskRow key={task.id} task={task} onClick={() => setSelectedTaskId(task.id)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={showAddBacklog} onClose={() => setShowAddBacklog(false)} title="Add to Backlog" size="lg">
        <CreateTaskForm
          projectId={projectId}
          sprintId={null}
          members={members}
          epics={epics}
          sprints={sprints}
          onSuccess={handleBacklogAdd}
          onCancel={() => setShowAddBacklog(false)}
        />
      </Modal>

      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          members={members}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
        />
      )}
    </>
  );
}
