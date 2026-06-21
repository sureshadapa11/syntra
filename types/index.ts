import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      avatar?: string;
      departmentId?: string;
      teamId?: string;
    } & DefaultSession["user"];
  }
}

export type TaskStatus = "todo" | "in-progress" | "review" | "done";
export type TaskType = "story" | "task" | "bug" | "subtask";
export type Priority = "critical" | "high" | "medium" | "low";
export type LeaveType = "annual" | "sick" | "unpaid" | "wfh" | "maternity" | "paternity";
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
export type TicketCategory = "IT" | "HR" | "Finance" | "Admin" | "Other";
export type TicketStatus = "open" | "in-progress" | "resolved" | "closed";
export type SprintStatus = "planning" | "active" | "completed";
export type ProjectType = "scrum" | "kanban";
export type AttendanceType = "office" | "wfh" | "remote";
