"use client";

import Modal from "@/components/ui/Modal";

type Props = {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = "Supprimer",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
}: Props) => {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="mt-2 text-sm text-neutral-500">{message}</div>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
