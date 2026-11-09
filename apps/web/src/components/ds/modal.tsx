import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { cx } from "@/lib/cx";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}

export function Modal({
  open,
  onClose,
  children,
  width = "max-w-lg",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        data-testid="modal-backdrop"
        className="absolute inset-0 animate-fade bg-ink/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cx(
          "relative max-h-[92vh] w-full animate-rise overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl",
          width,
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-4 right-4 z-10 grid h-9 w-9 place-items-center rounded-full text-subtle hover:bg-paper-2 hover:text-ink"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}
