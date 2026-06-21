"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  FolderKanban,
  Ticket,
  Megaphone,
  FileText,
  BookOpen,
  MessageSquare,
  Settings,
  ChevronRight,
  Package,
} from "lucide-react";

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "People", href: "/people", icon: Users },
  { label: "Attendance", href: "/attendance", icon: Clock },
  { label: "Leaves", href: "/leaves", icon: Calendar },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Tickets", href: "/tickets", icon: Ticket },
  { label: "Announcements", href: "/announcements", icon: Megaphone },
  { label: "Files", href: "/files", icon: FileText },
  { label: "Wiki", href: "/wiki", icon: BookOpen },
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Assets", href: "/assets", icon: Package },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-slate-900 flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        <span className="text-white font-bold text-lg">Syntra</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group",
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={14} />}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-800">
        <p className="text-slate-600 text-xs px-3">© 2025 Syntra</p>
      </div>
    </aside>
  );
}
