// Themed confirmation dialog — replaces browser confirm() throughout the app
"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !loading) onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, loading]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && !loading && onCancel()}
    >
      <div
        className="rounded-2xl border shadow-2xl w-full max-w-sm p-6 relative"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
          animation: "dialogPop 0.18s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        {/* Close */}
        <button
          ref={cancelRef}
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-40"
          style={{ color: "var(--muted)" }}
        >
          <X size={15} />
        </button>

        {/* Icon */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center mb-4"
          style={{
            backgroundColor: danger
              ? "rgba(220,38,38,0.14)"
              : "rgba(181,80,47,0.15)",
          }}
        >
          <AlertTriangle
            size={20}
            style={{ color: danger ? "var(--danger, #e05c5c)" : "var(--accent)" }}
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
        <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--muted)" }}>
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            id="confirm-dialog-cancel"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm border transition-colors hover:bg-white/5 disabled:opacity-50"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          >
            {cancelLabel}
          </button>
          <button
            id="confirm-dialog-confirm"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 shadow-sm"
            style={{
              backgroundColor: danger ? "var(--danger, #dc2626)" : "var(--accent)",
              color: "#fff",
            }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes dialogPop {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
