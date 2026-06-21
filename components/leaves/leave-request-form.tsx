"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AlertCircle, CalendarDays, Info } from "lucide-react";

interface PublicHoliday { id: string; name: string; date: string; }

interface LeaveRequestFormProps {
  onSuccess: (leave: any) => void;
  onCancel: () => void;
}

const leaveTypes = [
  { value: "annual", label: "Annual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "unpaid", label: "Unpaid Leave" },
  { value: "wfh", label: "Work From Home" },
  { value: "maternity", label: "Maternity Leave" },
  { value: "paternity", label: "Paternity Leave" },
];

function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function calcWorkingDays(start: string, end: string, holidays: PublicHoliday[]) {
  if (!start || !end) return 0;
  const holidayDates = new Set(holidays.map((h) => h.date.split("T")[0]));
  let count = 0;
  const cur = new Date(start);
  const endDate = new Date(end);
  while (cur <= endDate) {
    const key = cur.toISOString().split("T")[0];
    if (!isWeekend(cur) && !holidayDates.has(key)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function getHolidaysInRange(start: string, end: string, holidays: PublicHoliday[]) {
  if (!start || !end) return [];
  const s = new Date(start), e = new Date(end);
  return holidays.filter((h) => {
    const d = new Date(h.date);
    return d >= s && d <= e;
  });
}

export function LeaveRequestForm({ onSuccess, onCancel }: LeaveRequestFormProps) {
  const [form, setForm] = useState({ type: "annual", startDate: "", endDate: "", reason: "" });
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/leaves/holidays?year=${new Date().getFullYear()}`)
      .then((r) => r.json())
      .then(setHolidays);
  }, []);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  const daysCount = form.startDate && form.endDate ? calcWorkingDays(form.startDate, form.endDate, holidays) : 0;
  const holidaysInRange = getHolidaysInRange(form.startDate, form.endDate, holidays);
  const isValidRange = form.startDate && form.endDate && new Date(form.endDate) >= new Date(form.startDate);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.startDate || !form.endDate) { setError("Please select start and end dates"); return; }
    if (!isValidRange) { setError("End date must be after start date"); return; }
    if (daysCount === 0) { setError("No working days in selected range"); return; }

    setLoading(true);
    setError("");

    const res = await fetch("/api/leaves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, daysCount }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "Failed to submit request"); return; }
    onSuccess(data);
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <Select
        id="type"
        label="Leave Type"
        value={form.type}
        onChange={(e) => set("type", e.target.value)}
        options={leaveTypes}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="startDate"
          label="Start Date"
          type="date"
          min={today}
          value={form.startDate}
          onChange={(e) => {
            set("startDate", e.target.value);
            if (form.endDate && e.target.value > form.endDate) set("endDate", "");
          }}
        />
        <Input
          id="endDate"
          label="End Date"
          type="date"
          min={form.startDate || today}
          value={form.endDate}
          onChange={(e) => set("endDate", e.target.value)}
        />
      </div>

      {/* Day count preview */}
      {isValidRange && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CalendarDays size={14} className="text-blue-600" />
              Working days requested
            </div>
            <span className={`text-lg font-bold ${daysCount > 0 ? "text-blue-600" : "text-red-500"}`}>
              {daysCount} {daysCount === 1 ? "day" : "days"}
            </span>
          </div>

          {holidaysInRange.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
              <Info size={12} className="mt-0.5 shrink-0" />
              <span>
                Excludes {holidaysInRange.length} public holiday{holidaysInRange.length > 1 ? "s" : ""}:{" "}
                {holidaysInRange.map((h) => h.name).join(", ")}
              </span>
            </div>
          )}

          {daysCount === 0 && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle size={12} /> Selected range falls entirely on weekends or public holidays
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="reason" className="text-sm font-medium text-slate-700">
          Reason <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="reason"
          rows={3}
          value={form.reason}
          onChange={(e) => set("reason", e.target.value)}
          placeholder="Brief reason for leave..."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 px-3 py-2.5 rounded-lg border border-red-100">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading} disabled={daysCount === 0 || !isValidRange}>
          Submit Request
        </Button>
      </div>
    </form>
  );
}
