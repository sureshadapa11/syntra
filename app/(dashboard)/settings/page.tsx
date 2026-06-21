"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { User, Lock, Layers, ShieldCheck, CalendarDays, Settings } from "lucide-react";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { SecuritySettings } from "@/components/settings/security-settings";
import { DepartmentsSettings } from "@/components/settings/departments-settings";
import { RolesSettings } from "@/components/settings/roles-settings";
import { LeavePolicySettings } from "@/components/settings/leave-policy-settings";

type Section = "profile" | "security" | "departments" | "roles" | "leave-policy";

interface NavItem {
  id: Section;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { id: "profile", label: "My Profile", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "departments", label: "Departments & Teams", icon: Layers, roles: ["admin", "hr"] },
  { id: "roles", label: "Roles & Permissions", icon: ShieldCheck, roles: ["admin"] },
  { id: "leave-policy", label: "Leave Policy", icon: CalendarDays, roles: ["admin", "hr"] },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [active, setActive] = useState<Section>("profile");

  const userRole = session?.user?.role ?? "";
  const visibleNav = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(userRole));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
          <Settings size={18} className="text-slate-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500">Manage your profile and workspace</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <aside className="w-52 shrink-0">
          <nav className="space-y-0.5">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon size={15} className={isActive ? "text-blue-600" : "text-slate-400"} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Role badge */}
          <div className="mt-6 px-3 py-3 bg-slate-50 border border-slate-100 rounded-xl">
            <p className="text-xs text-slate-400 font-medium">Signed in as</p>
            <p className="text-sm font-semibold text-slate-700 mt-0.5 truncate">{session?.user?.name}</p>
            <span className="inline-block mt-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full capitalize">
              {userRole}
            </span>
          </div>
        </aside>

        {/* Content panel */}
        <main className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl p-6">
          {active === "profile" && <ProfileSettings />}
          {active === "security" && <SecuritySettings />}
          {active === "departments" && <DepartmentsSettings />}
          {active === "roles" && <RolesSettings />}
          {active === "leave-policy" && <LeavePolicySettings />}
        </main>
      </div>
    </div>
  );
}
