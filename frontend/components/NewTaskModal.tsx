// NewTaskModal — full task creation form: name, remarks, dates, assignees, status, and client selection
"use client";

import { useState } from "react";
import { X, Loader2, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { Task, TaskStatus, TaskCreate, Client } from "@/lib/types";

interface NewTaskModalProps {
  clientId?: string;
  clients?: Client[];
  onClose: () => void;
  onCreated: (task: Task) => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "not_started", label: "Not Started" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
];

export default function NewTaskModal({
  clientId: initialClientId,
  clients,
  onClose,
  onCreated,
}: NewTaskModalProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialClientId || (clients && clients.length > 0 ? clients[0].id : "")
  );
  const [name, setName] = useState("");
  const [remarks, setRemarks] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneesRaw, setAssigneesRaw] = useState("");
  const [status, setStatus] = useState<TaskStatus>("not_started");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClientId) {
      setError("Please select a client.");
      return;
    }
    if (!name.trim()) {
      setError("Task name is required.");
      return;
    }

    const assignees = assigneesRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const body: TaskCreate = {
      name: name.trim(),
      remarks: remarks.trim() || null,
      start_date: startDate || null,
      due_date: dueDate || null,
      assignees,
      status,
      is_completed: status === "completed",
    };

    setLoading(true);
    setError(null);
    try {
      const task = await api.clients.createTask(selectedClientId, body);
      onCreated(task);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="rounded-2xl border shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-xl font-semibold"
            style={{
              fontFamily: "Fraunces, var(--font-fraunces), Georgia, serif",
              color: "var(--text)",
            }}
          >
            Create New Task
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
          {/* Client select if not fixed */}
          {!initialClientId && clients && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>
                Client *
              </label>
              <select
                id="new-task-client-select"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id} style={{ backgroundColor: "var(--surface)", color: "var(--text)" }}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Task name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>
              Task Name *
            </label>
            <input
              id="new-task-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Floor plan layout & 3D renders"
              autoFocus
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors"
              style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>
              Remarks <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              id="new-task-remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Notes or details (defaults to - if left empty)"
              rows={2}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none"
              style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>
                Start Date
              </label>
              <input
                id="new-task-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>
                Due Date
              </label>
              <input
                id="new-task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
              />
            </div>
          </div>

          {/* Assignees */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>
              Assignees <span className="normal-case font-normal">(optional — comma-separated)</span>
            </label>
            <input
              id="new-task-assignees"
              type="text"
              value={assigneesRaw}
              onChange={(e) => setAssigneesRaw(e.target.value)}
              placeholder="e.g. Adit, Riya"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>
              Status
            </label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  id={`new-task-status-${opt.value}`}
                  onClick={() => setStatus(opt.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors"
                  style={{
                    borderColor: status === opt.value ? "var(--accent)" : "var(--border)",
                    backgroundColor: status === opt.value ? "rgba(181,80,47,0.12)" : "transparent",
                    color: status === opt.value ? "var(--accent)" : "var(--muted)",
                  }}
                >
                  {opt.label}
                </button>
              ))}
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
              className="px-4 py-2 rounded-lg text-sm border transition-colors hover:bg-white/5"
              style={{ borderColor: "var(--border)", color: "var(--muted)" }}
            >
              Cancel
            </button>
            <button
              id="new-task-submit"
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-opacity disabled:opacity-60"
              style={{ backgroundColor: "var(--accent)", color: "#fff" }}
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
