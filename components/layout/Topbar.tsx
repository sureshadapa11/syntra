"use client";

import { signOut } from "next-auth/react";
import { Bell, Search, LogOut, ChevronDown } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useState } from "react";

interface TopbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    avatar?: string | null;
    role?: string;
  };
}

export default function Topbar({ user }: TopbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4 sticky top-0 z-10">
      <div className="flex-1 flex items-center gap-2 max-w-md">
        <Search size={16} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search..."
          className="flex-1 text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none bg-transparent"
        />
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 hover:bg-slate-100 rounded-lg px-2 py-1.5 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
              {getInitials(user.name ?? "U")}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-slate-800 leading-tight">
                {user.name}
              </p>
              <p className="text-xs text-slate-500 capitalize">{user.role}</p>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-800">{user.name}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
