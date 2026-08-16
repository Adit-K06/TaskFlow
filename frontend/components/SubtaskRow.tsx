// Single subtask row — checkbox, inline-editable fields (name, remarks, dates, assignees, status), delete
"use client";

import { useState, useRef, useEffect } from "react";
import { Trash2, ChevronDown } from "lucide-react";
import { Subtask, TaskStatus } from "@/lib/types";
import { api } from "@/lib/api";
import { formatShort, getDueColorClass } from "@/lib/dateUtils";

interface SubtaskRowProps {
  subtask: Subtask;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onUpdate: (id: string, patch: Partial<Subtask>) => void;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: "Not Started",
  ongoing: "Ongoing",
  completed: "Done",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  not_started: "var(--muted)",
  ongoing: "var(--due-warning)",
  completed: "var(--due-done)",
};

// ── Inline text editor (name / remarks / assignees) ────────────────────────────
function SubInlineText({
  value,
  onSave,
  placeholder = "—",
  maxLength,
  multiline,
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keep draft in sync when value prop changes externally (optimistic update / refetch)
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  function start() {
    setDraft(value);
    setEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      textareaRef.current?.focus();
    }, 0);
  }

  function save() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== value) onSave(trimmed);
    else setDraft(value);
  }

  const inputStyle: React.CSSProperties = {
    borderColor: "var(--accent)",
    color: "var(--text)",
    backgroundColor: "transparent",
  };

  if (editing) {
    return multiline ? (
      <textarea
        ref={textareaRef}
        value={draft}
        rows={2}
        maxLength={maxLength}
        autoComplete="off"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Escape") { setEditing(false); setDraft(value); }
        }}
        className="w-full text-xs outline-none border-b bg-transparent resize-none"
        style={inputStyle}
      />
    ) : (
      <input
        ref={inputRef}
        value={draft}
        maxLength={maxLength}
        autoComplete="off"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); save(); }
          if (e.key === "Escape") { setEditing(false); setDraft(value); }
        }}
        className="w-full text-xs outline-none border-b bg-transparent"
        style={inputStyle}
      />
    );
  }

  return (
    <span
      onClick={start}
      className="cursor-text block truncate text-xs"
      style={{ color: value ? "var(--text)" : "var(--muted)", opacity: value ? 1 : 0.5 }}
      title={value || placeholder}
    >
      {value || placeholder}
    </span>
  );
}

// ── Inline date picker — click to open native calendar, no typing required ─────
function SubInlineDatePicker({
  value,
  onSave,
  dueColorClass,
}: {
  value: string | null;
  onSave: (v: string | null) => void;
  dueColorClass?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  function openPicker() {
    ref.current?.showPicker?.();
  }

  const display = formatShort(value);
  const isEmpty = !value;

  return (
    <div className="relative cursor-pointer" onClick={openPicker} title="Click to pick date">
      {/* Formatted display text */}
      <span
        className="text-xs tabular-nums block"
        style={{
          color: isEmpty
            ? "var(--muted)"
            : dueColorClass
            ? `var(--${dueColorClass})`
            : "var(--muted)",
          fontStyle: isEmpty ? "italic" : "normal",
          opacity: isEmpty ? 0.5 : 1,
        }}
      >
        {display}
      </span>

      {/* Hidden date input — opened programmatically via showPicker() */}
      <input
        ref={ref}
        type="date"
        value={value ?? ""}
        onChange={(e) => onSave(e.target.value || null)}
        style={{
          position: "absolute",
          opacity: 0,
          pointerEvents: "none",
          width: "1px",
          height: "1px",
          top: 0,
          left: 0,
        }}
      />
    </div>
  );
}

// ── Main SubtaskRow ────────────────────────────────────────────────────────────
export default function SubtaskRow({ subtask, onToggle, onDelete, onRename, onUpdate }: SubtaskRowProps) {
  const [hovered, setHovered] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  async function patch(updates: Partial<Subtask>) {
    onUpdate(subtask.id, updates);       // instant — UI updates before network
    try {
      await api.subtasks.update(subtask.id, updates as Record<string, unknown>);
    } catch {
      onUpdate(subtask.id, subtask);     // revert to original on failure
    }
  }

  const dueClass = getDueColorClass(subtask.due_date, subtask.is_completed);

  return (
    <div
      className="grid gap-x-3 px-3 py-2 rounded transition-colors group relative"
      style={{
        // Mirror the parent task table column proportions — name flex, then fixed columns
        gridTemplateColumns: "1.5rem 1fr 1fr 90px 90px 120px 100px 24px",
        backgroundColor: hovered ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.01)",
        borderLeft: "2px solid var(--border)",
        marginLeft: "8px",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setStatusOpen(false); }}
    >
      {/* Checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id={`subtask-check-${subtask.id}`}
          checked={subtask.is_completed}
          onChange={(e) => {
            onToggle(subtask.id, e.target.checked);
            patch({ is_completed: e.target.checked, status: e.target.checked ? "completed" : "not_started" });
          }}
          className="w-3 h-3 rounded-sm shrink-0 cursor-pointer accent-[var(--accent)]"
        />
      </div>

      {/* Name */}
      <div className="flex items-center min-w-0">
        <span
          className="flex-1 min-w-0"
          style={{
            textDecoration: subtask.is_completed ? "line-through" : "none",
            textDecorationColor: "var(--muted)",
            opacity: subtask.is_completed ? 0.55 : 1,
          }}
        >
          <SubInlineText
            value={subtask.name}
            onSave={(v) => {
              onRename(subtask.id, v);
              patch({ name: v });
            }}
            maxLength={500}
          />
        </span>
      </div>

      {/* Remarks */}
      <div className="flex items-center min-w-0">
        <SubInlineText
          value={subtask.remarks ?? ""}
          onSave={(v) => patch({ remarks: v || null })}
          placeholder="Remarks…"
          maxLength={300}
          multiline
        />
      </div>

      {/* Start date */}
      <div className="flex items-center">
        <SubInlineDatePicker
          value={subtask.start_date}
          onSave={(v) => patch({ start_date: v })}
        />
      </div>

      {/* Due date */}
      <div className="flex items-center">
        <SubInlineDatePicker
          value={subtask.due_date}
          onSave={(v) => patch({ due_date: v })}
          dueColorClass={dueClass}
        />
      </div>

      {/* Assignees */}
      <div className="flex items-center min-w-0">
        <SubInlineText
          value={subtask.assignees.join(", ")}
          onSave={(v) => patch({ assignees: v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [] })}
          placeholder="Assign…"
          maxLength={200}
        />
      </div>

      {/* Status dropdown */}
      <div className="flex items-center relative">
        <button
          onClick={() => setStatusOpen((o) => !o)}
          className="flex items-center gap-0.5 text-[10px] font-medium rounded px-1.5 py-0.5 border transition-colors w-full justify-between"
          style={{
            borderColor: "var(--border)",
            color: STATUS_COLORS[subtask.status],
            backgroundColor: "transparent",
          }}
        >
          <span className="truncate">{STATUS_LABELS[subtask.status]}</span>
          <ChevronDown size={8} className="shrink-0" />
        </button>

        {statusOpen && (
          <div
            className="absolute z-50 top-full left-0 mt-1 rounded-lg shadow-xl border py-1 min-w-[110px]"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            {(["not_started", "ongoing", "completed"] as TaskStatus[]).map((s) => (
              <button
                key={s}
                className="w-full text-left px-3 py-1.5 text-[10px] hover:bg-white/5 transition-colors"
                style={{ color: STATUS_COLORS[s] }}
                onClick={() => {
                  patch({ status: s, is_completed: s === "completed" });
                  if (s === "completed") onToggle(subtask.id, true);
                  setStatusOpen(false);
                }}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Delete */}
      <div className="flex items-center justify-end">
        {hovered && (
          <button
            id={`subtask-delete-${subtask.id}`}
            onClick={() => onDelete(subtask.id)}
            className="p-0.5 rounded opacity-50 hover:opacity-100 transition-opacity shrink-0"
            style={{ color: "var(--danger)" }}
            title="Delete subtask"
          >
            <Trash2 size={10} />
          </button>
        )}
      </div>
    </div>
  );
}
