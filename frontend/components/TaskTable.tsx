// TaskTable — groups tasks by month, renders MonthGroup rows, manages NewTaskModal
"use client";

import { useState, useCallback } from "react";
import { Loader2, ClipboardList, Plus } from "lucide-react";
import { Task, Client } from "@/lib/types";
import { groupByMonth } from "@/lib/dateUtils";
import { FilterState } from "./FilterBar";
import MonthGroup from "./MonthGroup";
import NewTaskModal from "./NewTaskModal";

interface TaskTableProps {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  clientId?: string;
  clients?: Client[];
  showClient?: boolean;
  filters: FilterState;
  onTasksChange: (tasks: Task[]) => void;
  flashTaskId?: string | null;
}

function applyFilters(tasks: Task[], f: FilterState): Task[] {
  return tasks.filter((t) => {
    if (f.statuses.length > 0 && !f.statuses.includes(t.status)) return false;
    if (f.startFrom && (t.start_date ?? "") < f.startFrom) return false;
    if (f.startTo && (t.start_date ?? "9999") > f.startTo) return false;
    if (f.dueFrom && (t.due_date ?? "") < f.dueFrom) return false;
    if (f.dueTo && (t.due_date ?? "9999") > f.dueTo) return false;
    return true;
  });
}

const TABLE_HEADERS = [
  { label: "#", className: "w-10 text-right" },
  { label: "✓", className: "w-8 text-center" },
  { label: "Task", className: "min-w-[160px] flex-1" },
  { label: "Remarks", className: "w-36 hidden md:table-cell" },
  { label: "Start", className: "w-24 hidden lg:table-cell" },
  { label: "Due", className: "w-24" },
  { label: "Assignees", className: "w-28 hidden lg:table-cell" },
  { label: "Status", className: "w-28 hidden sm:table-cell" },
  { label: "Progress", className: "w-28 hidden md:table-cell" },
  { label: "", className: "w-8" },
];

export default function TaskTable({
  tasks,
  loading,
  error,
  clientId,
  clients,
  showClient,
  filters,
  onTasksChange,
  flashTaskId,
}: TaskTableProps) {
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  const filtered = applyFilters(tasks, filters);
  const groups = groupByMonth(filtered);

  const handleUpdate = useCallback(
    (id: string, patch: Partial<Task>) => {
      onTasksChange(tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    },
    [tasks, onTasksChange]
  );

  const handleDelete = useCallback(
    (id: string) => {
      onTasksChange(tasks.filter((t) => t.id !== id));
    },
    [tasks, onTasksChange]
  );

  function handleTaskCreated(created: Task) {
    onTasksChange([...tasks, created]);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={20} className="animate-spin" style={{ color: "var(--muted)" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-24">
        <p style={{ color: "var(--danger)" }} className="text-sm">{error}</p>
      </div>
    );
  }

  const currentClient = clientId ? clients?.find((c) => c.id === clientId) : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Top action bar: Client Name & + Add Task */}
      <div className="flex items-center justify-between px-1 py-1">
        <div className="flex items-center gap-2.5">
          {currentClient ? (
            <div className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: currentClient.color }}
              />
              <h2
                className="text-base font-bold tracking-tight"
                style={{ color: "var(--text)" }}
              >
                {currentClient.name}
              </h2>
              {currentClient.category && (
                <span className="text-xs italic" style={{ color: "var(--muted)" }}>
                  ({currentClient.category})
                </span>
              )}
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full ml-1"
                style={{ backgroundColor: "var(--surface)", color: "var(--accent)", border: "1px solid var(--border)" }}
              >
                {filtered.length} {filtered.length === 1 ? "Task" : "Tasks"}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                {showClient ? "All Clients Tasks" : "Tasks"}
              </span>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)" }}
              >
                {filtered.length}
              </span>
            </div>
          )}
        </div>

        <button
          id="table-add-task-btn"
          onClick={() => setShowNewTaskModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm hover:opacity-90 active:scale-95"
          style={{ backgroundColor: "var(--accent)", color: "#fff" }}
        >
          <Plus size={14} />
          Add Task
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 flex flex-col items-center gap-3 border rounded-xl" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <ClipboardList size={36} style={{ color: "var(--muted)", opacity: 0.4 }} />
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {tasks.length === 0
              ? "No tasks yet. Click below to add your first task."
              : "No tasks match the current filters."}
          </p>
          <button
            id="empty-add-task-btn"
            onClick={() => setShowNewTaskModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border border-dashed transition-colors"
            style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
          >
            <Plus size={14} />
            Add First Task
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <table className="w-full border-collapse" style={{ minWidth: "600px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "rgba(255,255,255,0.02)" }}>
                {TABLE_HEADERS.map((h) => (
                  <th
                    key={h.label}
                    className={`px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest ${h.className}`}
                    style={{ color: "var(--muted)" }}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {groups.map(({ key, label, tasks: groupTasks }) => (
                <MonthGroup
                  key={key}
                  label={label}
                  monthKey={key}
                  tasks={groupTasks}
                  clients={clients}
                  showClient={showClient}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  flashTaskId={flashTaskId}
                  onNewTask={() => setShowNewTaskModal(true)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Task Modal */}
      {showNewTaskModal && (
        <NewTaskModal
          clientId={clientId}
          clients={clients}
          onClose={() => setShowNewTaskModal(false)}
          onCreated={handleTaskCreated}
        />
      )}
    </div>
  );
}
