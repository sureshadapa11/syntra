"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, Briefcase, FileText, Image } from "lucide-react";

interface Profile {
  id: string; name: string; email: string; phone: string | null;
  bio: string | null; jobTitle: string | null; avatar: string | null;
  employmentType: string; startDate: string | null;
  role: { name: string }; department: { name: string } | null; team: { name: string } | null;
}

export function ProfileSettings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", bio: "", jobTitle: "", avatar: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/users/me").then((r) => r.json()).then((data) => {
      setProfile(data);
      setForm({
        name: data.name ?? "",
        phone: data.phone ?? "",
        bio: data.bio ?? "",
        jobTitle: data.jobTitle ?? "",
        avatar: data.avatar ?? "",
      });
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setProfile((prev) => prev ? { ...prev, ...data } : prev);
      setMsg({ type: "success", text: "Profile updated successfully" });
    } else {
      setMsg({ type: "error", text: data.error ?? "Something went wrong" });
    }
  }

  if (!profile) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900">My Profile</h2>
        <p className="text-sm text-slate-500 mt-0.5">Update your personal information and how you appear to others</p>
      </div>

      {/* Read-only org info */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Role", value: profile.role.name },
          { label: "Department", value: profile.department?.name ?? "—" },
          { label: "Team", value: profile.team?.name ?? "—" },
        ].map((item) => (
          <div key={item.label} className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-400 font-medium">{item.label}</p>
            <p className="text-sm font-semibold text-slate-700 mt-0.5 capitalize">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-100" />

      {/* Editable fields */}
      <div className="space-y-4">
        <Field icon={User} label="Full Name" required>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="Your full name"
          />
        </Field>

        <Field icon={Mail} label="Email">
          <input
            value={profile.email}
            disabled
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-400 cursor-not-allowed"
          />
          <p className="text-xs text-slate-400 mt-1">Email cannot be changed. Contact your admin.</p>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field icon={Phone} label="Phone">
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="+91 98765 43210"
            />
          </Field>
          <Field icon={Briefcase} label="Job Title">
            <input
              value={form.jobTitle}
              onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="e.g. Senior Engineer"
            />
          </Field>
        </div>

        <Field icon={Image} label="Avatar URL">
          <input
            value={form.avatar}
            onChange={(e) => setForm({ ...form, avatar: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="https://..."
          />
          {form.avatar && (
            <img src={form.avatar} alt="avatar preview" className="mt-2 w-10 h-10 rounded-full object-cover border border-slate-200" />
          )}
        </Field>

        <Field icon={FileText} label="Bio">
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
            placeholder="A short bio about yourself…"
          />
        </Field>
      </div>

      {msg && (
        <div className={`text-sm px-4 py-3 rounded-lg border ${
          msg.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
        }`}>
          {msg.text}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, required, children }: {
  icon: React.ElementType; label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
        <Icon size={13} className="text-slate-400" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
