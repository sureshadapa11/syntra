"use client";

import { Avatar } from "@/components/ui/avatar";
import { MessageSquare, GitBranch, BookOpen, Bug, CheckSquare, Layers, AlertCircle, ArrowUp, ArrowDown, Minus } from "lucide-react";

export interface TaskCardData {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  storyPoints: number | null;
  dueDate: string | null;
  assignee: { id: string; name: string; avatar: string | null } | null;
  epic: { id: string; name: string; color: string } | null;
  _count: { comments: number; subtasks: number };
}

const typeIcons: Record<string, React.ElementType> = {
  story: BookOpen,
  task: CheckSquare,
  bug: Bug,
  subtask: GitBranch,
};

const typeColors: Record<string, string> = {
  story: "text-green-600",
  task: "text-blue-600",
  bug: "text-red-600",
  subtask: "text-slate-500",
};

const priorityIcons: Record<string, React.ElementType> = {
  critical: AlertCircle,
  high: ArrowUp,
  medium: Minus,
  low: ArrowDown,
};

const priorityColors: Record<string, string> = {
  critical: "text-red-600",
  high: "text-orange-500",
  medium: "text-amber-500",
  low: "text-slate-400",
};

interface TaskCardProps {
  task: TaskCardData;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

export function TaskCard({ task, onClick, onDragStart }: TaskCardProps) {
  const TypeIcon = typeIcons[task.type] ?? CheckSquare;
  const PriorityIcon = priorityIcons[task.priority] ?? Minus;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-lg p-3 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group select-none"
    >
      {task.epic && (
        <div className="flex items-center gap-1.5 mb-2">
          <span
            className="text-xs font-medium px-1.5 py-0.5 rounded"
            style={{ backgroundColor: task.epic.color + "22", color: task.epic.color }}
          >
            {task.epic.name}
          </span>
        </div>
      )}

      <p className="text-sm font-medium text-slate-800 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
        {task.title}
      </p>

      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-1.5">
          <TypeIcon size={13} className={typeColors[task.type] ?? "text-slate-500"} />
          <PriorityIcon size={13} className={priorityColors[task.priority] ?? "text-slate-400"} />
          {task._count.comments > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-slate-400">
              <MessageSquare size={11} />
              {task._count.comments}
            </span>
          )}
          {task._count.subtasks > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-slate-400">
              <Layers size={11} />
              {task._count.subtasks}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {task.storyPoints !== null && (
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 w-5 h-5 flex items-center justify-center rounded">
              {task.storyPoints}
            </span>
          )}
          {isOverdue && (
            <span className="text-xs text-red-500 font-medium">!</span>
          )}
          {task.assignee && (
            <Avatar name={task.assignee.name} src={task.assignee.avatar} size="xs" />
          )}
        </div>
      </div>
    </div>
  );
}
