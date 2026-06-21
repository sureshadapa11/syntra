"use client";

import { Package, UserCheck, CheckCircle, Archive, Wrench } from "lucide-react";

interface Asset { status: string; type: string; }

interface AssetStatsProps { assets: Asset[]; }

export function AssetStats({ assets }: AssetStatsProps) {
  const total = assets.length;
  const available = assets.filter((a) => a.status === "available").length;
  const assigned = assets.filter((a) => a.status === "assigned").length;
  const maintenance = assets.filter((a) => a.status === "maintenance").length;
  const retired = assets.filter((a) => a.status === "retired").length;

  const stats = [
    { label: "Total Assets", value: total, icon: Package, bg: "bg-slate-50", border: "border-slate-200", color: "text-slate-700" },
    { label: "Available", value: available, icon: CheckCircle, bg: "bg-green-50", border: "border-green-100", color: "text-green-700" },
    { label: "Assigned", value: assigned, icon: UserCheck, bg: "bg-blue-50", border: "border-blue-100", color: "text-blue-700" },
    { label: "In Maintenance", value: maintenance, icon: Wrench, bg: "bg-amber-50", border: "border-amber-100", color: "text-amber-700" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className={`rounded-xl border ${s.border} ${s.bg} px-4 py-3 flex items-center gap-3`}>
            <div className="p-2 rounded-lg bg-white/70">
              <Icon size={16} className={s.color} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
