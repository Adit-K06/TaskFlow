// Expanded subtask section below a task row — loads, lists, and adds subtasks
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
    // Optimistic update
    const updated = subtasks.map((s) =>
      s.id === id ? { ...s, is_completed: completed } : s
    );
    onSubtasksChange?.(updated);
    try {
      await api.subtasks.update(id, { is_completed: completed });
      refetch();
    } catch {
      refetch(); // rollback via refetch
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.subtasks.delete(id);
      refetch();
      onSubtasksChange?.(subtasks.filter((s) => s.id !== id));
    } catch {
      // silent — subtask still exists
    }
  }

  function handleRename(id: string, name: string) {
    const updated = subtasks.map((s) => (s.id === id ? { ...s, name } : s));
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
      // keep input value so user can retry
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
      className="px-2 py-1 border-t"
      style={{ borderColor: "var(--border)", backgroundColor: "rgba(0,0,0,0.12)" }}
    >
      {/* Subtask list */}
      {subtasks.map((s) => (
        <SubtaskRow
          key={s.id}
          subtask={s}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onRename={handleRename}
        />
      ))}

      {/* Add subtask input */}
      <div className="flex items-center gap-2 px-3 py-1.5">
        <Plus size={11} style={{ color: "var(--muted)" }} />
        <input
          id={`add-subtask-input-${taskId}`}
          type="text"
          placeholder="Add subtask…"
          value={newName}
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
