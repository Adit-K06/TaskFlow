// Single subtask row — checkbox + inline-editable name + delete
"use client";

import { useState, useRef } from "react";
import { Trash2 } from "lucide-react";
import { Subtask } from "@/lib/types";
import { api } from "@/lib/api";

interface SubtaskRowProps {
  subtask: Subtask;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export default function SubtaskRow({ subtask, onToggle, onDelete, onRename }: SubtaskRowProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(subtask.name);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleNameClick() {
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  async function handleNameSave() {
    setEditing(false);
    const trimmed = name.trim();
    if (!trimmed || trimmed === subtask.name) {
      setName(subtask.name);
      return;
    }
    try {
      await api.subtasks.update(subtask.id, { name: trimmed });
      onRename(subtask.id, trimmed);
    } catch {
      setName(subtask.name);
    }
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-1 rounded transition-colors group"
      style={{
        backgroundColor: hovered ? "rgba(255,255,255,0.04)" : "transparent",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        id={`subtask-check-${subtask.id}`}
        checked={subtask.is_completed}
        onChange={(e) => onToggle(subtask.id, e.target.checked)}
        className="w-3.5 h-3.5 rounded-sm shrink-0 cursor-pointer accent-[var(--accent)]"
      />

      {/* Name */}
      {editing ? (
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleNameSave();
            if (e.key === "Escape") { setEditing(false); setName(subtask.name); }
          }}
          className="flex-1 text-xs bg-transparent border-b outline-none"
          style={{ borderColor: "var(--accent)", color: "var(--text)" }}
        />
      ) : (
        <span
          onClick={handleNameClick}
          className="flex-1 text-xs cursor-text select-none"
          style={{
            color: subtask.is_completed ? "var(--muted)" : "var(--text)",
            textDecoration: subtask.is_completed ? "line-through" : "none",
            textDecorationColor: "var(--muted)",
          }}
        >
          {subtask.name}
        </span>
      )}

      {/* Delete */}
      {hovered && (
        <button
          id={`subtask-delete-${subtask.id}`}
          onClick={() => onDelete(subtask.id)}
          className="p-0.5 rounded opacity-50 hover:opacity-100 transition-opacity shrink-0"
          style={{ color: "var(--danger)" }}
          title="Delete subtask"
        >
          <Trash2 size={11} />
        </button>
      )}
    </div>
  );
}
