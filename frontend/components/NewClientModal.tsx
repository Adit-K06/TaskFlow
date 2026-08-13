// Modal to create a new client — name, category, color picker
"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Client } from "@/lib/types";

const PRESET_COLORS = [
  "#B5502F", "#5B6FA8", "#6E7D5C", "#C9A227",
  "#7A4E9A", "#2E8B6F", "#C44B3B", "#8B6914",
];

interface NewClientModalProps {
  onClose: () => void;
  onCreated: (client: Client) => void;
}

export default function NewClientModal({ onClose, onCreated }: NewClientModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Client name is required."); return; }
    setLoading(true);
    setError(null);
    try {
      const client = await api.clients.create({
        name: name.trim(),
        category: category.trim() || null,
        color,
      });
      // Notify all useClients instances (sidebar, pages) to refetch immediately
      window.dispatchEvent(new CustomEvent("clients-changed"));
      onCreated(client);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client");
    } finally {
      setLoading(false);
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
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-xl font-semibold"
            style={{ fontFamily: "Fraunces, var(--font-fraunces), Georgia, serif", color: "var(--text)" }}
          >
            New Client
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: "var(--muted)" }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
              style={{ color: "var(--muted)" }}
            >
              Name *
            </label>
            <input
              id="new-client-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Skyline Residence"
              autoFocus
              autoComplete="off"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--accent)]"
              style={{
                backgroundColor: "var(--bg)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
          </div>

          {/* Category */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
              style={{ color: "var(--muted)" }}
            >
              Category
            </label>
            <input
              id="new-client-category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. 3D Design, 2D Drawings"
              autoComplete="off"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--accent)]"
              style={{
                backgroundColor: "var(--bg)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
          </div>

          {/* Color */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
              style={{ color: "var(--muted)" }}
            >
              Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "var(--text)" : "transparent",
                  }}
                  title={c}
                />
              ))}
              {/* Custom color */}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-7 h-7 rounded-full cursor-pointer border-0 p-0"
                title="Custom color"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm border transition-colors"
              style={{ borderColor: "var(--border)", color: "var(--muted)" }}
            >
              Cancel
            </button>
            <button
              id="new-client-submit"
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-opacity disabled:opacity-60"
              style={{ backgroundColor: "var(--accent)", color: "#fff" }}
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              Create Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
