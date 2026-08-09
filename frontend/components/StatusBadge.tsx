// Colored status badge with dropdown to change status — design.md §4
"use client";

import { useState, useRef, useEffect } from "react";
import { TaskStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: TaskStatus;
  taskId: string;
  onStatusChange: (newStatus: TaskStatus) => void;
  disabled?: boolean;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; bg: string; text: string }> = {
  not_started: {
    label: "Not Started",
    bg: "rgba(169,162,155,0.18)",
    text: "var(--muted)",
  },
  ongoing: {
    label: "Ongoing",
    bg: "rgba(181,80,47,0.22)",
    text: "var(--accent)",
  },
  completed: {
    label: "Completed",
    bg: "rgba(110,125,92,0.22)",
    text: "var(--success)",
  },
};

const STATUSES: TaskStatus[] = ["not_started", "ongoing", "completed"];

export default function StatusBadge({
  status,
  taskId,
  onStatusChange,
  disabled = false,
}: StatusBadgeProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = STATUS_CONFIG[status];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        id={`status-badge-${taskId}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80 disabled:cursor-default"
        style={{ backgroundColor: cfg.bg, color: cfg.text }}
        title="Click to change status"
      >
        {cfg.label}
      </button>

      {open && (
        <div
          className="absolute z-50 top-full mt-1 left-0 rounded-md shadow-xl border overflow-hidden"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
            minWidth: "8rem",
          }}
        >
          {STATUSES.map((s) => {
            const c = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                id={`status-option-${taskId}-${s}`}
                onClick={() => {
                  onStatusChange(s);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors text-left"
                style={{
                  color: s === status ? c.text : "var(--muted)",
                  backgroundColor: s === status ? c.bg : "transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = c.bg;
                  (e.currentTarget as HTMLElement).style.color = c.text;
                }}
                onMouseLeave={(e) => {
                  if (s !== status) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "var(--muted)";
                  }
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
