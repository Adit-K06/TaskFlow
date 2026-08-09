// Modal to edit or delete a client — pre-filled form + destructive delete confirm
"use client";

import { useState } from "react";
import { X, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { Client } from "@/lib/types";

const PRESET_COLORS = [
  "#B5502F", "#5B6FA8", "#6E7D5C", "#C9A227",
  "#7A4E9A", "#2E8B6F", "#C44B3B", "#8B6914",
];

interface EditClientModalProps {
  client: Client;
  taskCount: number;
  onClose: () => void;
  onUpdated: (client: Client) => void;
  onDeleted: (id: string) => void;
}

export default function EditClientModal({
  client,
  taskCount,
  onClose,
  onUpdated,
  onDeleted,
}: EditClientModalProps) {
  const [name, setName] = useState(client.name);
  const [category, setCategory] = useState(client.category ?? "");
  const [color, setColor] = useState(client.color);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Client name is required."); return; }
    setSaving(true);
    setError(null);
    try {
      const updated = await api.clients.update(client.id, {
        name: name.trim(),
        category: category.trim() || null,
        color,
      });
      window.dispatchEvent(new CustomEvent("clients-changed"));
      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update client");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.clients.delete(client.id);
      window.dispatchEvent(new CustomEvent("clients-changed"));
      onDeleted(client.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete client");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="rounded-2xl border shadow-2xl w-full max-w-md p-6"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        {/* Delete confirmation overlay */}
        {confirmDelete ? (
          <div className="text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "rgba(181,52,46,0.18)" }}
            >
              <AlertTriangle size={22} style={{ color: "var(--danger)" }} />
            </div>
            <h2
              className="text-lg font-semibold mb-2"
              style={{ fontFamily: "Fraunces, var(--font-fraunces), Georgia, serif", color: "var(--text)" }}
            >
              Delete {client.name}?
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
              This will permanently delete all{" "}
              <strong style={{ color: "var(--text)" }}>{taskCount} tasks</strong> and
              their subtasks. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 rounded-lg text-sm border"
                style={{ borderColor: "var(--border)", color: "var(--muted)" }}
              >
                Cancel
              </button>
              <button
                id="confirm-delete-client-btn"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: "var(--danger)", color: "#fff" }}
              >
                {deleting && <Loader2 size={13} className="animate-spin" />}
                Delete Permanently
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2
                className="text-xl font-semibold"
                style={{ fontFamily: "Fraunces, var(--font-fraunces), Georgia, serif", color: "var(--text)" }}
              >
                Edit Client
              </h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: "var(--muted)" }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>
                  Name *
                </label>
                <input
                  id="edit-client-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>
                  Category
                </label>
                <input
                  id="edit-client-category"
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>
                  Color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                      style={{ backgroundColor: c, borderColor: color === c ? "var(--text)" : "transparent" }}
                    />
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-7 h-7 rounded-full cursor-pointer border-0 p-0"
                  />
                </div>
              </div>

              {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-colors"
                  style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
                >
                  <Trash2 size={12} />
                  Delete Client
                </button>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-sm border"
                    style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                  >
                    Cancel
                  </button>
                  <button
                    id="edit-client-submit"
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-60"
                    style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                  >
                    {saving && <Loader2 size={13} className="animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
