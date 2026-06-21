"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Role { id: string; name: string; }
interface Department { id: string; name: string; }
interface Team { id: string; name: string; }
interface User { id: string; name: string; }

interface EmployeeFormData {
  name: string;
  email: string;
  password: string;
  jobTitle: string;
  phone: string;
  employmentType: string;
  departmentId: string;
  teamId: string;
  roleId: string;
  managerId: string;
  startDate: string;
  bio: string;
  skills: string;
  status: string;
}

interface EmployeeFormProps {
  initialData?: Partial<EmployeeFormData>;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

export function EmployeeForm({ initialData, onSubmit, onCancel, isEdit }: EmployeeFormProps) {
  const [form, setForm] = useState<EmployeeFormData>({
    name: "",
    email: "",
    password: "",
    jobTitle: "",
    phone: "",
    employmentType: "full-time",
    departmentId: "",
    teamId: "",
    roleId: "",
    managerId: "",
    startDate: "",
    bio: "",
    skills: "",
    status: "active",
    ...initialData,
  });

  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof EmployeeFormData, string>>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/roles").then((r) => r.json()),
      fetch("/api/departments").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]).then(([rolesData, deptsData, usersData]) => {
      setRoles(rolesData);
      setDepartments(deptsData);
      setManagers(usersData);
    });
  }, []);

  useEffect(() => {
    if (form.departmentId) {
      fetch(`/api/teams?departmentId=${form.departmentId}`)
        .then((r) => r.json())
        .then(setTeams);
    } else {
      setTeams([]);
      setForm((f) => ({ ...f, teamId: "" }));
    }
  }, [form.departmentId]);

  function set(field: keyof EmployeeFormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate() {
    const errs: Partial<Record<keyof EmployeeFormData, string>> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Invalid email";
    if (!isEdit && !form.password) errs.password = "Password is required";
    if (!form.roleId) errs.roleId = "Role is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit(form);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      {/* Personal Info */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Personal Information</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input id="name" label="Full Name *" placeholder="John Smith" value={form.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
          <Input id="email" label="Email Address *" type="email" placeholder="john@company.com" value={form.email} onChange={(e) => set("email", e.target.value)} error={errors.email} />
          <Input id="phone" label="Phone Number" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          {!isEdit && (
            <Input id="password" label="Password *" type="password" placeholder="Min 8 characters" value={form.password} onChange={(e) => set("password", e.target.value)} error={errors.password} hint="Default: Welcome@123 if left blank" />
          )}
        </div>
      </div>

      {/* Job Details */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Job Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input id="jobTitle" label="Job Title" placeholder="Senior Developer" value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} />
          <Select
            id="employmentType"
            label="Employment Type"
            value={form.employmentType}
            onChange={(e) => set("employmentType", e.target.value)}
            options={[
              { value: "full-time", label: "Full Time" },
              { value: "part-time", label: "Part Time" },
              { value: "contractor", label: "Contractor" },
              { value: "intern", label: "Intern" },
            ]}
          />
          <Input id="startDate" label="Start Date" type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
          <Select
            id="status"
            label="Status"
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "on-leave", label: "On Leave" },
            ]}
          />
        </div>
      </div>

      {/* Organisation */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Organisation</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            id="roleId"
            label="Role *"
            value={form.roleId}
            onChange={(e) => set("roleId", e.target.value)}
            error={errors.roleId}
            placeholder="Select role"
            options={roles.map((r) => ({ value: r.id, label: r.name.charAt(0).toUpperCase() + r.name.slice(1) }))}
          />
          <Select
            id="departmentId"
            label="Department"
            value={form.departmentId}
            onChange={(e) => set("departmentId", e.target.value)}
            placeholder="Select department"
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
          />
          <Select
            id="teamId"
            label="Team"
            value={form.teamId}
            onChange={(e) => set("teamId", e.target.value)}
            placeholder={form.departmentId ? "Select team" : "Select department first"}
            options={teams.map((t) => ({ value: t.id, label: t.name }))}
          />
          <Select
            id="managerId"
            label="Reports To (Manager)"
            value={form.managerId}
            onChange={(e) => set("managerId", e.target.value)}
            placeholder="Select manager"
            options={managers.map((m) => ({ value: m.id, label: m.name }))}
          />
        </div>
      </div>

      {/* Additional */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Additional</p>
        <div className="space-y-4">
          <Input id="skills" label="Skills (comma separated)" placeholder="React, Node.js, TypeScript" value={form.skills} onChange={(e) => set("skills", e.target.value)} hint="e.g. React, Node.js, AWS" />
          <div className="flex flex-col gap-1">
            <label htmlFor="bio" className="text-sm font-medium text-slate-700">Bio</label>
            <textarea
              id="bio"
              rows={3}
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              placeholder="Brief description about this employee..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>{isEdit ? "Save Changes" : "Add Employee"}</Button>
      </div>
    </form>
  );
}
