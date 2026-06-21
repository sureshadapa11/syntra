"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Columns, ListOrdered, Users, Settings } from "lucide-react";

const tabs = [
  { label: "Board", href: "board", icon: Columns },
  { label: "Backlog", href: "backlog", icon: ListOrdered },
  { label: "Members", href: "members", icon: Users },
  { label: "Settings", href: "settings", icon: Settings },
];

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-0.5">
      {tabs.map((tab) => {
        const href = `/projects/${projectId}/${tab.href}`;
        const active = pathname === href || pathname.startsWith(href + "/");
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={href}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              active ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            <Icon size={14} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
