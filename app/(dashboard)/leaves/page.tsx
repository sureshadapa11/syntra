"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { MyLeaves } from "@/components/leaves/my-leaves";
import { ApprovalQueue } from "@/components/leaves/approval-queue";
import { LeaveCalendar } from "@/components/leaves/leave-calendar";
import { HolidaysSection } from "@/components/leaves/holidays-section";
import { CalendarDays, ClipboardList, Calendar, LayoutGrid } from "lucide-react";

const tabs = [
  { id: "mine", label: "My Leaves", icon: CalendarDays },
  { id: "team", label: "Team Requests", icon: ClipboardList },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "holidays", label: "Holidays", icon: LayoutGrid },
];

const managerRoles = ["admin", "manager", "hr"];

export default function LeavesPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("mine");

  const isManager = managerRoles.includes(session?.user?.role ?? "");
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "hr";

  const visibleTabs = tabs.filter((t) => t.id !== "team" || isManager);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Leave Management</h1>
        <p className="text-sm text-slate-500 mt-1">Track time off, manage requests, and view team availability</p>
      </div>

      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "mine" && <MyLeaves />}
      {activeTab === "team" && isManager && <ApprovalQueue />}
      {activeTab === "calendar" && <LeaveCalendar />}
      {activeTab === "holidays" && <HolidaysSection isAdmin={isAdmin} />}
    </div>
  );
}
