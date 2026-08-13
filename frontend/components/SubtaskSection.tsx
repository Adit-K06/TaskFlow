// Expanded subtask section — loads, lists subtasks with full field editing, and adds new subtasks
"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Subtask } from "@/lib/types";
import { api } from "@/lib/api";
import { useSubtasks } from "@/hooks/useSubtasks";
import SubtaskRow from "./SubtaskRow";

interface SubtaskSectionProps {
  taskId: string;
  onSubtasksChange?: (subtasks: Subtask[]) => void;
}

export default function SubtaskSection({ taskId, onSubtasksChange }: SubtaskSectionProps) {
  const { subtasks, loading, refetch } = useSubtasks(taskId);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleToggle(id: string, completed: boolean) {
    const updated = subtasks.map((s) =>
      s.id === id ? { ...s, is_completed: completed } : s
    );
    onSubtasksChange?.(updated);
    try {
      await api.subtasks.update(id, { is_completed: completed });
      refetch();
    } catch {
      refetch();
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.subtasks.delete(id);
      refetch();
      onSubtasksChange?.(subtasks.filter((s) => s.id !== id));
    } catch {
      // silent
    }
  }

  function handleRename(id: string, name: string) {
    const updated = subtasks.map((s) => (s.id === id ? { ...s, name } : s));
    onSubtasksChange?.(updated);
  }

  function handleUpdate(id: string, patch: Partial<Subtask>) {
    const updated = subtasks.map((s) => (s.id === id ? { ...s, ...patch } : s));
    onSubtasksChange?.(updated);
  }

  async function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setAdding(true);
    try {
      await api.tasks.createSubtask(taskId, { name: trimmed });
      setNewName("");
      refetch();
    } catch {
      // keep input so user can retry
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-6 py-2">
        <Loader2 size={12} className="animate-spin" style={{ color: "var(--muted)" }} />
        <span className="text-xs" style={{ color: "var(--muted)" }}>Loading subtasks…</span>
      </div>
    );
  }

  return (
    <div
      className="py-1 border-t"
      style={{ borderColor: "var(--border)", backgroundColor: "rgba(0,0,0,0.12)" }}
    >
      {/* Column headers for subtask grid */}
      {subtasks.length > 0 && (
        <div
          className="grid gap-x-2 px-3 pb-1 mb-0.5"
          style={{
            gridTemplateColumns: "1.5rem 1fr 160px 72px 72px 90px 80px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {["", "Subtask", "Remarks", "Start", "Due", "Assignees", "Status", ""].map((h, i) => (
            <span
              key={i}
              className="text-[9px] font-bold uppercase tracking-widest"
              style={{ color: "var(--muted)" }}
            >
              {h}
            </span>
          ))}
        </div>
      )}

      {/* Subtask rows */}
      <div className="flex flex-col gap-0.5 py-1">
        {subtasks.map((s) => (
          <SubtaskRow
            key={s.id}
            subtask={s}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onRename={handleRename}
            onUpdate={handleUpdate}
          />
        ))}
      </div>

      {/* Add subtask input */}
      <div className="flex items-center gap-2 px-3 py-1.5">
        <Plus size={11} style={{ color: "var(--muted)" }} />
        <input
          id={`add-subtask-input-${taskId}`}
          type="text"
          placeholder="Add subtask…"
          value={newName}
          autoComplete="off"
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
            if (e.key === "Escape") setNewName("");
          }}
          disabled={adding}
          className="flex-1 text-xs bg-transparent outline-none placeholder:text-[var(--muted)]"
          style={{ color: "var(--text)" }}
        />
        {newName.trim() && (
          <button
            onClick={handleAdd}
            disabled={adding}
            className="text-xs px-2 py-0.5 rounded transition-colors"
            style={{ backgroundColor: "var(--accent)", color: "#fff" }}
          >
            {adding ? "…" : "Add"}
          </button>
        )}
      </div>
    </div>
  );
}
