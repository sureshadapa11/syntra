"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";

const ASSET_TYPES = [
  "Laptop", "Desktop", "Monitor", "Keyboard", "Mouse", "Headset",
  "Phone", "Tablet", "Docking Station", "Webcam", "Chair", "Desk", "Other",
];

const typeOptions = ASSET_TYPES.map((t) => ({ value: t, label: t }));

interface AssetFormProps {
  initial?: { id: string; name: string; type: string; serialNumber: string | null };
  onSuccess: (asset: any) => void;
  onCancel: () => void;
}

export function AssetForm({ initial, onSuccess, onCancel }: AssetFormProps) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    type: initial?.type ?? "Laptop",
    serialNumber: initial?.serialNumber ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!initial;

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required"); return; }

    setLoading(true);
    const res = await fetch(isEdit ? `/api/assets/${initial!.id}` : "/api/assets", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "Failed to save"); return; }
    onSuccess(data);
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <Input
        id="asset-name"
        label="Asset Name"
        placeholder="e.g. MacBook Pro 14-inch"
        value={form.name}
        onChange={(e) => set("name", e.target.value)}
      />

      <Select
        id="asset-type"
        label="Type"
        value={form.type}
        onChange={(e) => set("type", e.target.value)}
        options={typeOptions}
      />

      <Input
        id="asset-serial"
        label="Serial Number"
        placeholder="e.g. C02XG1JFHV2Q"
        value={form.serialNumber}
        onChange={(e) => set("serialNumber", e.target.value)}
        hint="Optional — helps with identification and audits"
      />

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2.5 rounded-lg border border-red-100">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>{isEdit ? "Save Changes" : "Add Asset"}</Button>
      </div>
    </form>
  );
}
