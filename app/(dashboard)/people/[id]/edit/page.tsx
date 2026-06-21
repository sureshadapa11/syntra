"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EmployeeForm } from "@/components/people/employee-form";
import { Avatar } from "@/components/ui/avatar";

export default function EditEmployeePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/users/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load employee");
        setLoading(false);
      });
  }, [id]);

  async function handleSubmit(data: any) {
    const skillsArray = data.skills
      ? data.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];

    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, skills: skillsArray }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update employee");
    }

    router.push(`/people/${id}`);
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-600">{error || "Employee not found"}</p>
        <Link href="/people" className="text-blue-600 text-sm mt-2 inline-block hover:underline">Back to People</Link>
      </div>
    );
  }

  const skillsString = Array.isArray(user.skills) ? (user.skills as string[]).join(", ") : "";

  return (
    <div className="max-w-3xl space-y-5">
      <Link href={`/people/${id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft size={15} /> Back to Profile
      </Link>

      <div className="flex items-center gap-4">
        <Avatar name={user.name} src={user.avatar} size="lg" />
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Edit {user.name}</h1>
          <p className="text-sm text-slate-500">{user.jobTitle ?? "No title"} · {user.email}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <EmployeeForm
          isEdit
          initialData={{
            name: user.name,
            email: user.email,
            jobTitle: user.jobTitle ?? "",
            phone: user.phone ?? "",
            employmentType: user.employmentType,
            departmentId: user.department?.id ?? "",
            teamId: user.team?.id ?? "",
            roleId: user.roleId,
            managerId: user.manager?.id ?? "",
            startDate: user.startDate ? new Date(user.startDate).toISOString().split("T")[0] : "",
            bio: user.bio ?? "",
            skills: skillsString,
            status: user.status,
          }}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/people/${id}`)}
        />
      </div>
    </div>
  );
}
