"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, Trash2, CalendarDays, Globe } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Holiday {
  id: string;
  name: string;
  date: string;
  country: string;
}

interface HolidaysSectionProps {
  isAdmin: boolean;
}

export function HolidaysSection({ isAdmin }: HolidaysSectionProps) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ name: "", date: "" });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const year = new Date().getFullYear();

  useEffect(() => {
    fetch(`/api/leaves/holidays?year=${year}`)
      .then((r) => r.json())
      .then((d) => { setHolidays(d); setLoading(false); });
  }, [year]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.date) { setError("Name and date are required"); return; }
    setAdding(true);
    setError("");
    const res = await fetch("/api/leaves/holidays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, country: "IN" }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed to add holiday"); setAdding(false); return; }
    setHolidays((prev) => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)));
    setForm({ name: "", date: "" });
    setShowAdd(false);
    setAdding(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    await fetch("/api/leaves/holidays", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteId }),
    });
    setHolidays((prev) => prev.filter((h) => h.id !== deleteId));
    setDeleteId(null);
    setDeleting(false);
  }

  const upcoming = holidays.filter((h) => new Date(h.date) >= new Date());
  const past = holidays.filter((h) => new Date(h.date) < new Date());

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Public Holidays {year}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{upcoming.length} upcoming · {holidays.length} total</p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
            <Plus size={13} /> Add Holiday
          </Button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <Input
              id="hol-name"
              label="Holiday Name"
              placeholder="e.g. Diwali"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="w-44">
            <Input
              id="hol-date"
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
          {error && <p className="text-xs text-red-600 self-center">{error}</p>}
          <div className="flex gap-2 pb-0.5">
            <Button type="button" variant="outline" size="sm" onClick={() => { setShowAdd(false); setError(""); }}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={adding}>Add</Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : holidays.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <CalendarDays size={40} className="mb-3 opacity-40" />
          <p className="font-medium text-slate-600">No holidays added yet</p>
          {isAdmin && <p className="text-sm mt-1">Add public holidays that will be excluded from leave counts</p>}
        </div>
      ) : (
        <div>
          {upcoming.length > 0 && (
            <>
              <div className="px-5 py-2 bg-slate-50 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Upcoming</p>
              </div>
              <div className="divide-y divide-slate-100">
                {upcoming.map((h) => (
                  <HolidayRow key={h.id} holiday={h} isAdmin={isAdmin} onDelete={setDeleteId} />
                ))}
              </div>
            </>
          )}
          {past.length > 0 && (
            <>
              <div className="px-5 py-2 bg-slate-50 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Past</p>
              </div>
              <div className="divide-y divide-slate-100">
                {past.map((h) => (
                  <HolidayRow key={h.id} holiday={h} isAdmin={isAdmin} onDelete={setDeleteId} past />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Holiday"
        description="Remove this public holiday? It will affect future leave calculations."
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}

function HolidayRow({
  holiday, isAdmin, onDelete, past = false,
}: {
  holiday: Holiday; isAdmin: boolean; onDelete: (id: string) => void; past?: boolean;
}) {
  const date = new Date(holiday.date);
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
  const daysUntil = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className={`flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors ${past ? "opacity-60" : ""}`}>
      <div className="w-12 h-12 rounded-xl bg-blue-50 flex flex-col items-center justify-center shrink-0">
        <span className="text-xs font-medium text-blue-600 uppercase">
          {date.toLocaleDateString("en-US", { month: "short" })}
        </span>
        <span className="text-lg font-bold text-blue-700 leading-tight">{date.getDate()}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900">{holiday.name}</p>
        <p className="text-xs text-slate-400 mt-0.5">{dayName} · {formatDate(holiday.date)}</p>
      </div>

      {!past && daysUntil <= 30 && daysUntil > 0 && (
        <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 shrink-0">
          In {daysUntil} day{daysUntil !== 1 ? "s" : ""}
        </span>
      )}
      {!past && daysUntil === 0 && (
        <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-100 shrink-0">
          Today
        </span>
      )}

      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Globe size={11} /> {holiday.country}
        </span>
        {isAdmin && (
          <button
            onClick={() => onDelete(holiday.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors ml-1"
            title="Delete holiday"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
