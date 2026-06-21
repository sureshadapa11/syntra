"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

export function SecuritySettings() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSave() {
    if (form.newPassword !== form.confirmPassword) {
      setMsg({ type: "error", text: "New passwords do not match" });
      return;
    }
    if (form.newPassword.length < 8) {
      setMsg({ type: "error", text: "Password must be at least 8 characters" });
      return;
    }
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setMsg({ type: "success", text: "Password changed successfully" });
    } else {
      setMsg({ type: "error", text: data.error ?? "Something went wrong" });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Security</h2>
        <p className="text-sm text-slate-500 mt-0.5">Change your password to keep your account secure</p>
      </div>

      <div className="max-w-md space-y-4">
        <PasswordField
          label="Current Password"
          value={form.currentPassword}
          show={show.current}
          onChange={(v) => setForm({ ...form, currentPassword: v })}
          onToggle={() => setShow({ ...show, current: !show.current })}
        />
        <PasswordField
          label="New Password"
          value={form.newPassword}
          show={show.new}
          onChange={(v) => setForm({ ...form, newPassword: v })}
          onToggle={() => setShow({ ...show, new: !show.new })}
          hint="Minimum 8 characters"
        />
        <PasswordField
          label="Confirm New Password"
          value={form.confirmPassword}
          show={show.confirm}
          onChange={(v) => setForm({ ...form, confirmPassword: v })}
          onToggle={() => setShow({ ...show, confirm: !show.confirm })}
        />
      </div>

      {/* Password strength */}
      {form.newPassword.length > 0 && (
        <div className="max-w-md">
          <PasswordStrength password={form.newPassword} />
        </div>
      )}

      {msg && (
        <div className={`max-w-md text-sm px-4 py-3 rounded-lg border ${
          msg.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
        }`}>
          {msg.text}
        </div>
      )}

      <div className="flex justify-end max-w-md">
        <button
          onClick={handleSave}
          disabled={saving || !form.currentPassword || !form.newPassword || !form.confirmPassword}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Lock size={13} />
          {saving ? "Updating…" : "Update Password"}
        </button>
      </div>
    </div>
  );
}

function PasswordField({ label, value, show, onChange, onToggle, hint }: {
  label: string; value: string; show: boolean;
  onChange: (v: string) => void; onToggle: () => void; hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 pr-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /[0-9]/.test(password) },
    { label: "Symbol", pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const colors = ["bg-red-400", "bg-orange-400", "bg-amber-400", "bg-green-500"];
  const labels = ["Weak", "Fair", "Good", "Strong"];

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < score ? colors[score - 1] : "bg-slate-100"} transition-colors`} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {checks.map((c) => (
            <span key={c.label} className={`text-xs ${c.pass ? "text-green-600" : "text-slate-400"}`}>
              {c.pass ? "✓" : "○"} {c.label}
            </span>
          ))}
        </div>
        {score > 0 && <span className={`text-xs font-medium ${["text-red-600","text-orange-600","text-amber-600","text-green-600"][score-1]}`}>{labels[score-1]}</span>}
      </div>
    </div>
  );
}
