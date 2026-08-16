// TaskRow — single task row: inline editing, checkbox/status sync, subtask expansion, delete
"use client";

import { useState, useRef } from "react";
import { ChevronRight, Trash2 } from "lucide-react";
import { Task, TaskStatus, Subtask } from "@/lib/types";
import { api } from "@/lib/api";
import { formatShort, getDueColorClass, getDueLabel } from "@/lib/dateUtils";
import StatusBadge from "./StatusBadge";
import ProgressBar from "./ProgressBar";
import ClientColorChip from "./ClientColorChip";
import SubtaskSection from "./SubtaskSection";
import ConfirmDialog from "./ConfirmDialog";

interface TaskRowProps {
  task: Task;
  srNo: number;
  showClient?: boolean;
  clientName?: string;
  clientColor?: string;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
  flashId?: string | null;
}

// ── Inline text cell ────────────────────────────────────────────────────────────
function InlineText({
  value,
  onSave,
  placeholder = "—",
  multiline,
  strikethrough,
  muted,
  maxLength,
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  onChange?: (v: string) => void;
  strikethrough?: boolean;
  muted?: boolean;
  maxLength?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const sharedInputStyle: React.CSSProperties = {
    borderColor: "var(--accent)",
    color: "var(--text)",
    backgroundColor: "transparent",
  };
  const sharedInputClass = "w-full text-sm outline-none border-b bg-transparent";

  if (editing) {
    return multiline ? (
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={draft}
          rows={3}
          maxLength={maxLength}
          autoComplete="off"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Escape") { setEditing(false); setDraft(value); }
          }}
          className={sharedInputClass + " resize-none"}
          style={sharedInputStyle}
        />
        {maxLength && (
          <span className="absolute bottom-0 right-0 text-[9px]" style={{ color: "var(--muted)" }}>
            {draft.length}/{maxLength}
          </span>
        )}
      </div>
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
        className={sharedInputClass}
        style={sharedInputStyle}
      />
    );
  }

  const isEmpty = !value;
  return (
    <span
      onClick={start}
      title={isEmpty ? `Click to add ${placeholder}` : value}
      className={`block text-sm cursor-text select-none group-cell ${multiline ? "whitespace-pre-wrap line-clamp-3" : "truncate"}`}
      style={{
        color: isEmpty ? "var(--muted)" : muted ? "var(--muted)" : "var(--text)",
        textDecoration: strikethrough && !isEmpty ? "line-through" : "none",
        textDecorationColor: "var(--muted)",
        fontStyle: isEmpty ? "italic" : "normal",
      }}
    >
      {isEmpty ? placeholder : value}
    </span>
  );
}

// ── Inline date picker — click to open native calendar, no typing required ─────
function InlineDatePicker({
  value,
  onSave,
  dueColorClass,
  tooltip,
}: {
  value: string | null;
  onSave: (v: string | null) => void;
  dueColorClass?: string;
  tooltip?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  function openPicker() {
    ref.current?.showPicker?.();
  }

  const display = formatShort(value);
  const isEmpty = !value;

  return (
    <div className="relative cursor-pointer" onClick={openPicker} title={tooltip ?? (isEmpty ? "Click to pick date" : display)}>
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

// ── Inline assignees ─────────────────────────────────────────────────────────────
function InlineAssignees({
  assignees,
  onSave,
}: {
  assignees: string[];
  onSave: (v: string[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(assignees.join(", "));

  function save() {
    setEditing(false);
    const parsed = draft.split(",").map((s) => s.trim()).filter(Boolean);
    onSave(parsed);
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setEditing(false);
        }}
        placeholder="Adit, Riya"
        className="w-full text-xs bg-transparent border-b outline-none"
        style={{ borderColor: "var(--accent)", color: "var(--text)" }}
      />
    );
  }

  if (assignees.length === 0) {
    return (
      <span
        onClick={() => { setDraft(""); setEditing(true); }}
        className="text-xs cursor-pointer italic"
        style={{ color: "var(--muted)" }}
        title="Click to add assignees"
      >
        —
      </span>
    );
  }

  return (
    <div
      className="flex gap-1 flex-wrap cursor-pointer"
      onClick={() => { setDraft(assignees.join(", ")); setEditing(true); }}
      title="Click to edit assignees"
    >
      {assignees.slice(0, 3).map((a) => (
        <span
          key={a}
          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold uppercase shrink-0"
          style={{ backgroundColor: "rgba(181,80,47,0.2)", color: "var(--accent)" }}
          title={a}
        >
          {a.slice(0, 2)}
        </span>
      ))}
      {assignees.length > 3 && (
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold"
          style={{ backgroundColor: "var(--border)", color: "var(--muted)" }}
        >
          +{assignees.length - 3}
        </span>
      )}
    </div>
  );
}

// ── Main TaskRow ─────────────────────────────────────────────────────────────────
export default function TaskRow({
  task,
  srNo,
  showClient,
  clientName,
  clientColor,
  onUpdate,
  onDelete,
  flashId,
}: TaskRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [localSubtasks, setLocalSubtasks] = useState<Subtask[] | null>(null);

  const isCompleted = task.is_completed;
  const dueClass = getDueColorClass(task.due_date, isCompleted);
  const dueLabel = getDueLabel(task.due_date, isCompleted);

  // Subtask counts — local optimistic OR from backend-provided counts
  const stTotal = localSubtasks ? localSubtasks.length : task.subtask_count;
  const stDone = localSubtasks
    ? localSubtasks.filter((s) => s.is_completed).length
    : task.completed_subtask_count;

  async function patch(data: Partial<Task>) {
    onUpdate(task.id, data);
    try {
      await api.tasks.update(task.id, data);
    } catch {
      onUpdate(task.id, task); // revert on failure
    }
  }

  function handleCheckbox(checked: boolean) {
    patch({
      is_completed: checked,
      status: checked ? "completed" : "ongoing",
    });
  }

  function handleStatusChange(newStatus: TaskStatus) {
    patch({
      status: newStatus,
      is_completed: newStatus === "completed",
    });
  }

  async function handleDelete() {
    try {
      await api.tasks.delete(task.id);
      onDelete(task.id);
    } catch {
      // If delete fails, keep the row — don't remove optimistically
    } finally {
      setConfirmDelete(false);
    }
  }

  const rowBg = hovered ? "rgba(255,255,255,0.035)" : "transparent";

  return (
    <>
      <tr
        id={`task-row-${task.id}`}
        className={flashId === task.id ? "row-flash" : ""}
        style={{ backgroundColor: rowBg }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Sr No */}
        <td className="px-3 py-2.5 text-xs text-right tabular-nums w-10 shrink-0" style={{ color: "var(--muted)" }}>
          {srNo}
        </td>

        {/* Done checkbox */}
        <td className="px-2 py-2.5 w-8 text-center">
          <input
            type="checkbox"
            id={`task-done-${task.id}`}
            checked={isCompleted}
            onChange={(e) => handleCheckbox(e.target.checked)}
            className="w-4 h-4 rounded cursor-pointer accent-[var(--accent)]"
          />
        </td>

        {/* Task name + expand chevron */}
        <td className="px-2 py-2.5 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              onClick={() => setExpanded((x) => !x)}
              className="shrink-0 transition-transform duration-150"
              style={{
                transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                color: stTotal > 0 ? "var(--accent)" : "var(--muted)",
              }}
              title={stTotal > 0 ? "Toggle subtasks" : "No subtasks"}
            >
              <ChevronRight size={13} />
            </button>
            <div className="flex-1 min-w-0">
              {showClient && clientColor && clientName && (
                <div className="mb-0.5">
                  <ClientColorChip color={clientColor} name={clientName} />
                </div>
              )}
              <InlineText
                value={task.name}
                onSave={(v) => patch({ name: v || task.name })}
                placeholder="Task name"
                strikethrough={isCompleted}
                muted={isCompleted}
              />
            </div>
          </div>
        </td>

        {/* Remarks */}
        <td className="px-2 py-2.5 w-44 min-w-0 hidden md:table-cell">
          <InlineText
            value={task.remarks ?? ""}
            onSave={(v) => patch({ remarks: v || null })}
            placeholder="—"
            muted
            multiline
            maxLength={300}
          />
        </td>

        {/* Start date */}
        <td className="px-2 py-2.5 w-24 hidden lg:table-cell">
          <InlineDatePicker
            value={task.start_date}
            onSave={(v) => patch({ start_date: v })}
          />
        </td>

        {/* Due date */}
        <td className="px-2 py-2.5 w-24">
          <InlineDatePicker
            value={task.due_date}
            onSave={(v) => patch({ due_date: v })}
            dueColorClass={dueClass}
            tooltip={dueLabel}
          />
        </td>

        {/* Assignees */}
        <td className="px-2 py-2.5 w-28 hidden lg:table-cell">
          <InlineAssignees
            assignees={task.assignees}
            onSave={(v) => patch({ assignees: v })}
          />
        </td>

        {/* Status */}
        <td className="px-2 py-2.5 w-28 hidden sm:table-cell">
          <StatusBadge
            status={task.status}
            taskId={task.id}
            onStatusChange={handleStatusChange}
          />
        </td>

        {/* Progress */}
        <td className="px-2 py-2.5 w-28 hidden md:table-cell">
          <ProgressBar
            completed={stDone}
            total={stTotal}
            isCompleted={isCompleted}
          />
        </td>

        {/* Delete */}
        <td className="px-2 py-2.5 w-8 text-center">
          <button
            id={`task-delete-${task.id}`}
            onClick={() => setConfirmDelete(true)}
            className="p-1 rounded transition-opacity"
            style={{
              color: "var(--danger)",
              opacity: hovered ? 1 : 0,
              pointerEvents: hovered ? "auto" : "none",
            }}
            title="Delete task"
          >
            <Trash2 size={13} />
          </button>
        </td>
      </tr>

      {/* Subtask expansion row */}
      {expanded && (
        <tr>
          <td colSpan={10} className="p-0">
            <SubtaskSection
              taskId={task.id}
              onSubtasksChange={(subtasks) => {
                setLocalSubtasks(subtasks);
                // Also patch the parent's subtask_count for the progress bar after toggle
                onUpdate(task.id, {
                  subtask_count: subtasks.length,
                  completed_subtask_count: subtasks.filter((s) => s.is_completed).length,
                } as Partial<Task>);
              }}
            />
          </td>
        </tr>
      )}

      {/* Themed delete confirmation */}
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete "${task.name}"?`}
          message="This task and all its subtasks will be permanently deleted. This cannot be undone."
          confirmLabel="Delete Task"
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}
