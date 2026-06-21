"use client";

import { Modal } from "./modal";
import { Button } from "./button";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = "Delete", loading }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="p-6 space-y-4">
        <p className="text-sm text-slate-600">{description}</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  );
}
