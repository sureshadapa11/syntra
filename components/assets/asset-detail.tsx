"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AssetForm } from "./asset-form";
import { AssignModal } from "./assign-modal";
import { formatDate } from "@/lib/utils";
import {
  X, Pencil, Trash2, UserPlus, Wrench, Archive, CheckCircle,
  Laptop, Monitor, Keyboard, Mouse, Headphones, Smartphone, Tablet, Package,
  Hash, Calendar, User,
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

interface AssetDetailProps {
  asset: Asset;
  canManage: boolean;
  onClose: () => void;
  onUpdate: (asset: Asset) => void;
  onDelete: (id: string) => void;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  Laptop: Laptop, Desktop: Monitor, Monitor, Keyboard,
  Mouse, Headset: Headphones, Phone: Smartphone, Tablet, Package,
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  available: { label: "Available", color: "text-green-700 bg-green-50 border-green-100", dot: "bg-green-500" },
  assigned: { label: "Assigned", color: "text-blue-700 bg-blue-50 border-blue-100", dot: "bg-blue-500" },
  maintenance: { label: "In Maintenance", color: "text-amber-700 bg-amber-50 border-amber-100", dot: "bg-amber-500" },
  retired: { label: "Retired", color: "text-slate-600 bg-slate-100 border-slate-200", dot: "bg-slate-400" },
};

export function AssetDetail({ asset, canManage, onClose, onUpdate, onDelete }: AssetDetailProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const TypeIcon = TYPE_ICONS[asset.type] ?? Package;
  const statusCfg = STATUS_CONFIG[asset.status] ?? STATUS_CONFIG.available;

  async function handleStatusChange(newStatus: string) {
    const res = await fetch(`/api/assets/${asset.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: newStatus,
        ...(newStatus !== "assigned" && { assignedToId: null }),
      }),
    });
    const updated = await res.json();
    onUpdate(updated);
  }

  async function handleAssign(userId: string | null) {
    setAssigning(true);
    const res = await fetch(`/api/assets/${asset.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedToId: userId }),
    });
    const updated = await res.json();
    onUpdate(updated);
    setShowAssign(false);
    setAssigning(false);
  }

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/assets/${asset.id}`, { method: "DELETE" });
    onDelete(asset.id);
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
        <div className="w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <TypeIcon size={20} className="text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{asset.type}</p>
                <h2 className="text-base font-bold text-slate-900 leading-tight">{asset.name}</h2>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {canManage && (
                <>
                  <button onClick={() => setShowEdit(true)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => setShowDelete(true)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </>
              )}
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Status badge */}
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full border ${statusCfg.color}`}>
                <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
            </div>

            {/* Details */}
            <div className="space-y-3">
              {asset.serialNumber && (
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Hash size={15} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Serial Number</p>
                    <p className="text-sm font-mono font-semibold text-slate-800">{asset.serialNumber}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                <Calendar size={15} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 font-medium">Added on</p>
                  <p className="text-sm font-medium text-slate-800">{formatDate(asset.createdAt)}</p>
                </div>
              </div>

              {asset.assignedDate && (
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Calendar size={15} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Assigned on</p>
                    <p className="text-sm font-medium text-slate-800">{formatDate(asset.assignedDate)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Assigned to */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Assigned To</p>
              {asset.assignedTo ? (
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <Avatar name={asset.assignedTo.name} src={asset.assignedTo.avatar} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{asset.assignedTo.name}</p>
                    <p className="text-xs text-slate-500">
                      {asset.assignedTo.jobTitle}
                      {asset.assignedTo.department ? ` · ${asset.assignedTo.department.name}` : ""}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                  <User size={18} />
                  <span className="text-sm">Not assigned</span>
                </div>
              )}
            </div>

            {/* Actions */}
            {canManage && asset.status !== "retired" && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Actions</p>

                <button
                  onClick={() => setShowAssign(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-700 transition-colors text-sm font-medium"
                >
                  <UserPlus size={16} />
                  {asset.assignedTo ? "Reassign asset" : "Assign to employee"}
                </button>

                {asset.status !== "maintenance" ? (
                  <button
                    onClick={() => handleStatusChange("maintenance")}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl hover:bg-amber-50 hover:border-amber-200 text-slate-700 hover:text-amber-700 transition-colors text-sm font-medium"
                  >
                    <Wrench size={16} />
                    Send to maintenance
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange("available")}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl hover:bg-green-50 hover:border-green-200 text-slate-700 hover:text-green-700 transition-colors text-sm font-medium"
                  >
                    <CheckCircle size={16} />
                    Mark as available
                  </button>
                )}

                <button
                  onClick={() => handleStatusChange("retired")}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors text-sm font-medium"
                >
                  <Archive size={16} />
                  Retire asset
                </button>
              </div>
            )}

            {asset.status === "retired" && canManage && (
              <button
                onClick={() => handleStatusChange("available")}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl hover:bg-green-50 hover:border-green-200 text-slate-600 hover:text-green-700 transition-colors text-sm font-medium"
              >
                <CheckCircle size={16} />
                Restore asset
              </button>
            )}
          </div>
        </div>
      </div>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Asset" size="md">
        <AssetForm
          initial={{ id: asset.id, name: asset.name, type: asset.type, serialNumber: asset.serialNumber }}
          onSuccess={(updated) => { onUpdate(updated); setShowEdit(false); }}
          onCancel={() => setShowEdit(false)}
        />
      </Modal>

      <Modal open={showAssign} onClose={() => setShowAssign(false)} title="Assign Asset" size="md">
        <AssignModal
          assetName={asset.name}
          currentAssigneeId={asset.assignedTo?.id ?? null}
          onAssign={handleAssign}
          onCancel={() => setShowAssign(false)}
          loading={assigning}
        />
      </Modal>

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Asset"
        description={`Permanently delete "${asset.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </>
  );
}
