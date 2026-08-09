// Themed confirmation dialog — replaces browser confirm() throughout the app
"use client";

import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        className="rounded-2xl border shadow-2xl w-full max-w-sm p-6 relative"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        {/* Close */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/10 transition-colors"
          style={{ color: "var(--muted)" }}
        >
          <X size={15} />
        </button>

        {/* Icon */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center mb-4"
          style={{
            backgroundColor: danger
              ? "rgba(181,52,46,0.18)"
              : "rgba(181,80,47,0.15)",
          }}
        >
          <AlertTriangle
            size={20}
            style={{ color: danger ? "var(--danger)" : "var(--accent)" }}
          />
        </div>

        {/* Text */}
        <h2
          className="text-lg font-semibold mb-2"
          style={{
            fontFamily: "Fraunces, var(--font-fraunces), Georgia, serif",
            color: "var(--text)",
          }}
        >
          {title}
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            id="confirm-dialog-cancel"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm border transition-colors hover:bg-white/5"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          >
            {cancelLabel}
          </button>
          <button
            id="confirm-dialog-confirm"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
            style={{
              backgroundColor: danger ? "var(--danger)" : "var(--accent)",
              color: "#fff",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
