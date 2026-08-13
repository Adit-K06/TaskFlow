// YearGroup (formerly MonthGroup) — collapsible yearly task group header with task rows inside
"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { Task, Client } from "@/lib/types";
import TaskRow from "./TaskRow";

interface MonthGroupProps {
  label: string;
  monthKey: string;
  tasks: Task[];
  clients?: Client[];
  showClient?: boolean;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
  flashTaskId?: string | null;
  onNewTask?: () => void;
}

export default function MonthGroup({
  label,
  monthKey,
  tasks,
  clients,
  showClient,
  onUpdate,
  onDelete,
  flashTaskId,
  onNewTask,
}: MonthGroupProps) {
  const [collapsed, setCollapsed] = useState(false);

  const clientMap = clients
    ? Object.fromEntries(clients.map((c) => [c.id, c]))
    : {};

  return (
    <>
      {/* Group header row */}
      <tr>
        <td
          colSpan={10}
          className="pt-4 pb-1 px-3"
          style={{ backgroundColor: "rgba(255,255,255,0.015)" }}
        >
          <div className="flex items-center justify-between">
            <button
              id={`year-group-${monthKey}`}
              onClick={() => setCollapsed((c) => !c)}
              className="flex items-center gap-2 group flex-1"
            >
              <ChevronDown
                size={14}
                className="transition-transform duration-150"
                style={{
                  color: "var(--muted)",
                  transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
                }}
              />
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--muted)" }}
              >
                {label}
              </span>
              <span
                className="text-xs tabular-nums"
                style={{ color: "var(--muted)", opacity: 0.6 }}
              >
                ({tasks.length})
              </span>
              <span
                className="flex-1 h-px ml-2"
                style={{ backgroundColor: "var(--border)" }}
              />
            </button>

            {onNewTask && !collapsed && (
              <button
                onClick={onNewTask}
                className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded transition-colors hover:text-[var(--accent)]"
                style={{ color: "var(--muted)" }}
                title="Add task to this group"
              >
                <Plus size={12} />
                Add
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Task rows */}
      {!collapsed &&
        tasks.map((task, idx) => {
          const c = clientMap[task.client_id];
          return (
            <TaskRow
              key={task.id}
              task={task}
              srNo={task.sr_no ?? idx + 1}
              showClient={showClient}
              clientName={c?.name}
              clientColor={c?.color}
              onUpdate={onUpdate}
              onDelete={onDelete}
              flashId={flashTaskId}
            />
          );
        })}
    </>
  );
}
