"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Stethoscope, Plane, Baby } from "lucide-react";

interface LeaveBalance {
  annualTotal: number;
  annualUsed: number;
  sickTotal: number;
  sickUsed: number;
}

const balanceCards = [
  {
    key: "annual",
    label: "Annual Leave",
    icon: Plane,
    color: "blue",
    bg: "bg-blue-50",
    iconColor: "text-blue-600",
    barColor: "bg-blue-500",
    textColor: "text-blue-700",
  },
  {
    key: "sick",
    label: "Sick Leave",
    icon: Stethoscope,
    color: "orange",
    bg: "bg-orange-50",
    iconColor: "text-orange-600",
    barColor: "bg-orange-500",
    textColor: "text-orange-700",
  },
];

export function LeaveBalance() {
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaves/balance")
      .then((r) => r.json())
      .then((d) => { setBalance(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-24 mb-3" />
            <div className="h-8 bg-slate-100 rounded w-16 mb-2" />
            <div className="h-2 bg-slate-100 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!balance) return null;

  const values: Record<string, { used: number; total: number }> = {
    annual: { used: balance.annualUsed, total: balance.annualTotal },
    sick: { used: balance.sickUsed, total: balance.sickTotal },
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {balanceCards.map((card) => {
        const { used, total } = values[card.key];
        const remaining = total - used;
        const pct = Math.min((used / total) * 100, 100);
        const Icon = card.icon;

        return (
          <div key={card.key} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-600">{card.label}</p>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <Icon size={14} className={card.iconColor} />
              </div>
            </div>

            <div className="mb-3">
              <span className={`text-3xl font-bold ${card.textColor}`}>{remaining}</span>
              <span className="text-sm text-slate-400 ml-1">/ {total} days left</span>
            </div>

            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full ${card.barColor} rounded-full transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-slate-400">
              <span>{used} used</span>
              <span>{total} total</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
