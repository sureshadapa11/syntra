"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AssetStats } from "@/components/assets/asset-stats";
import { AssetDetail } from "@/components/assets/asset-detail";
import { AssetForm } from "@/components/assets/asset-form";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import {
  Package, Plus, Search,
  Laptop, Monitor, Keyboard, Mouse, Headphones, Smartphone, Tablet,
  CheckCircle, UserCheck, Wrench, Archive,
} from "lucide-react";

interface Asset {
  id: string;
  name: string;
  type: string;
  serialNumber: string | null;
  status: string;
  assignedDate: string | null;
  createdAt: string;
  assignedTo: {
    id: string; name: string; avatar: string | null;
    jobTitle: string | null; department: { name: string } | null;
  } | null;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  Laptop, Desktop: Monitor, Monitor, Keyboard,
  Mouse, Headset: Headphones, Phone: Smartphone, Tablet,
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  available: { label: "Available", color: "bg-green-50 text-green-700 border-green-100", dot: "bg-green-500", icon: CheckCircle },
  assigned: { label: "Assigned", color: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500", icon: UserCheck },
  maintenance: { label: "Maintenance", color: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500", icon: Wrench },
  retired: { label: "Retired", color: "bg-slate-100 text-slate-500 border-slate-200", dot: "bg-slate-400", icon: Archive },
};

const ASSET_TYPES = [
  "Laptop", "Desktop", "Monitor", "Keyboard", "Mouse", "Headset",
  "Phone", "Tablet", "Docking Station", "Webcam", "Chair", "Desk", "Other",
];

const CAN_MANAGE_ROLES = ["admin", "hr", "it"];

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "available", label: "Available" },
  { value: "assigned", label: "Assigned" },
  { value: "maintenance", label: "Maintenance" },
  { value: "retired", label: "Retired" },
];

export default function AssetsPage() {
  const { data: session } = useSession();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const canManage = CAN_MANAGE_ROLES.includes(session?.user?.role ?? "");

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterStatus) params.set("status", filterStatus);
    if (filterType) params.set("type", filterType);
    const res = await fetch(`/api/assets?${params}`);
    setAssets(await res.json());
    setLoading(false);
  }, [search, filterStatus, filterType]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  function handleCreated(asset: Asset) {
    setAssets((prev) => [asset, ...prev]);
    setShowAdd(false);
    setSelectedId(asset.id);
  }

  function handleUpdated(updated: Asset) {
    setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  }

  function handleDeleted(id: string) {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    setSelectedId(null);
  }

  const selectedAsset = assets.find((a) => a.id === selectedId) ?? null;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Asset Management</h1>
          <p className="text-sm text-slate-500 mt-1">Track hardware, equipment, and company property</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={15} /> Add Asset
          </button>
        )}
      </div>

      {/* Stats */}
      {assets.length > 0 && <AssetStats assets={assets} />}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <Search size={14} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by name, type, or serial…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm bg-transparent focus:outline-none flex-1 text-slate-700 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterStatus === f.value
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-600 focus:outline-none bg-white"
        >
          <option value="">All Types</option>
          {ASSET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Column headers */}
        <div className="hidden md:grid grid-cols-12 px-5 py-3 border-b border-slate-100 bg-slate-50">
          <div className="col-span-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Asset</div>
          <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Serial No.</div>
          <div className="col-span-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Assigned To</div>
          <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</div>
          <div className="col-span-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">Added</div>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Package size={44} className="mb-3 opacity-30" />
            <p className="font-semibold text-slate-600">
              {search || filterStatus || filterType ? "No assets match your filters" : "No assets tracked yet"}
            </p>
            {!search && !filterStatus && !filterType && canManage && (
              <>
                <p className="text-sm mt-1">Start by adding hardware and equipment</p>
                <button
                  onClick={() => setShowAdd(true)}
                  className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus size={14} /> Add Asset
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {assets.map((asset) => {
              const TypeIcon = TYPE_ICONS[asset.type] ?? Package;
              const statusCfg = STATUS_CONFIG[asset.status] ?? STATUS_CONFIG.available;

              return (
                <div
                  key={asset.id}
                  onClick={() => setSelectedId(asset.id)}
                  className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  {/* Asset name + type icon */}
                  <div className="col-span-12 md:col-span-4 flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                      <TypeIcon size={17} className="text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{asset.name}</p>
                      <p className="text-xs text-slate-400">{asset.type}</p>
                    </div>
                  </div>

                  {/* Serial */}
                  <div className="hidden md:block col-span-2">
                    <p className="text-xs font-mono text-slate-500">{asset.serialNumber ?? "—"}</p>
                  </div>

                  {/* Assigned to */}
                  <div className="hidden md:flex col-span-3 items-center gap-2">
                    {asset.assignedTo ? (
                      <>
                        <Avatar name={asset.assignedTo.name} src={asset.assignedTo.avatar} size="xs" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-800 truncate">{asset.assignedTo.name}</p>
                          {asset.assignedTo.department && (
                            <p className="text-xs text-slate-400 truncate">{asset.assignedTo.department.name}</p>
                          )}
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">Unassigned</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="hidden md:block col-span-2">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${statusCfg.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="hidden md:block col-span-1 text-xs text-slate-400">
                    {formatDate(asset.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedAsset && (
        <AssetDetail
          asset={selectedAsset}
          canManage={canManage}
          onClose={() => setSelectedId(null)}
          onUpdate={handleUpdated}
          onDelete={handleDeleted}
        />
      )}

      {/* Add asset modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Asset" size="md">
        <AssetForm onSuccess={handleCreated} onCancel={() => setShowAdd(false)} />
      </Modal>
    </div>
  );
}
