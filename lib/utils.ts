import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function priorityColor(priority: string) {
  const map: Record<string, string> = {
    critical: "text-red-600 bg-red-50",
    high: "text-orange-600 bg-orange-50",
    medium: "text-yellow-600 bg-yellow-50",
    low: "text-green-600 bg-green-50",
  };
  return map[priority] ?? "text-gray-600 bg-gray-50";
}

export function statusColor(status: string) {
  const map: Record<string, string> = {
    todo: "text-gray-600 bg-gray-100",
    "in-progress": "text-blue-600 bg-blue-50",
    review: "text-purple-600 bg-purple-50",
    done: "text-green-600 bg-green-50",
    open: "text-blue-600 bg-blue-50",
    resolved: "text-green-600 bg-green-50",
    closed: "text-gray-600 bg-gray-100",
    pending: "text-yellow-600 bg-yellow-50",
    approved: "text-green-600 bg-green-50",
    rejected: "text-red-600 bg-red-50",
  };
  return map[status] ?? "text-gray-600 bg-gray-100";
}
