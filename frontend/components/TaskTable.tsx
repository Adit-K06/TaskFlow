// TaskTable — groups tasks by month, renders MonthGroup rows, manages NewTaskModal & NewClientModal
"use client";

import { useState, useCallback } from "react";
import { Loader2, ClipboardList, Plus, FolderPlus, WifiOff, RefreshCw, MousePointerClick } from "lucide-react";
import { Task, Client } from "@/lib/types";
import { groupByMonth } from "@/lib/dateUtils";
import { FilterState } from "./FilterBar";
import MonthGroup from "./MonthGroup";
import NewTaskModal from "./NewTaskModal";
import NewClientModal from "./NewClientModal";

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
  onRetry?: () => void;
  onClientCreated?: () => void;
  allowClientCreate?: boolean; // false on home page (show select-client hint instead)
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
  onRetry,
  onClientCreated,
  allowClientCreate = true,
}: TaskTableProps) {
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);

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
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 px-6 flex flex-col items-center justify-center gap-4 border rounded-2xl max-w-lg mx-auto my-10 shadow-sm" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <div className="p-4 rounded-full" style={{ backgroundColor: "rgba(220,38,38,0.12)", color: "var(--danger)" }}>
          <WifiOff size={32} />
        </div>
        <div className="max-w-sm">
          <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "Fraunces, var(--font-fraunces), serif", color: "var(--text)" }}>
            Unable to Connect
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
            {error.includes("Failed to fetch")
              ? "Could not connect to the TaskFlow backend server. Please make sure your backend is running."
              : error}
          </p>
        </div>
        {onRetry && (
          <button
            id="error-retry-btn"
            onClick={onRetry}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90 active:scale-95 shadow-md"
            style={{ backgroundColor: "var(--accent)", color: "#fff" }}
          >
            <RefreshCw size={14} />
            Retry Connection
          </button>
        )}
      </div>
    );
  }

  // Zero clients state — two variants: home page (select-client hint) vs client pages (create-client card)
  if (clients && clients.length === 0) {
    if (!allowClientCreate) {
      // Home page: clients exist elsewhere but none loaded yet, or this is the global view
      return (
        <div className="text-center py-16 px-6 flex flex-col items-center justify-center gap-4 border rounded-2xl max-w-md mx-auto my-10 shadow-sm" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <div className="p-4 rounded-full" style={{ backgroundColor: "rgba(181,80,47,0.10)", color: "var(--accent)" }}>
            <MousePointerClick size={36} />
          </div>
          <div className="max-w-sm">
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "Fraunces, var(--font-fraunces), Georgia, serif", color: "var(--text)" }}>
              Select a Client
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
              Click any client in the sidebar to view and manage its tasks. You can also create a new client using the <strong style={{ color: "var(--accent)" }}>+</strong> button next to &quot;Clients&quot;.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center py-16 px-6 flex flex-col items-center justify-center gap-4 border rounded-2xl max-w-md mx-auto my-10 shadow-sm" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <div className="p-4 rounded-full" style={{ backgroundColor: "rgba(181,80,47,0.12)", color: "var(--accent)" }}>
          <FolderPlus size={36} />
        </div>
        <div className="max-w-sm">
          <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "Fraunces, var(--font-fraunces), Georgia, serif", color: "var(--text)" }}>
            Welcome to TaskFlow!
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
            To start organizing tasks and managing projects, please create your first client.
          </p>
        </div>
        <button
          id="empty-create-client-btn"
          onClick={() => setShowNewClientModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90 active:scale-95 shadow-md"
          style={{ backgroundColor: "var(--accent)", color: "#fff" }}
        >
          <Plus size={15} />
          Create First Client
        </button>

        {showNewClientModal && (
          <NewClientModal
            onClose={() => setShowNewClientModal(false)}
            onCreated={() => {
              if (onClientCreated) onClientCreated();
            }}
          />
        )}
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
          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
            {tasks.length === 0 ? "No tasks found" : "No matching tasks"}
          </p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {tasks.length === 0
              ? "Click below to add your first task and start tracking progress."
              : "No tasks match the current filters."}
          </p>
          <button
            id="empty-add-task-btn"
            onClick={() => setShowNewTaskModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 shadow-sm"
            style={{ backgroundColor: "var(--accent)", color: "#fff" }}
          >
            <Plus size={14} />
            {tasks.length === 0 ? "Add First Task" : "Add Task"}
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

      {/* Modals */}
      {showNewTaskModal && (
        <NewTaskModal
          clientId={clientId}
          clients={clients}
          onClose={() => setShowNewTaskModal(false)}
          onCreated={handleTaskCreated}
          onOpenNewClientModal={() => setShowNewClientModal(true)}
        />
      )}
      {showNewClientModal && (
        <NewClientModal
          onClose={() => setShowNewClientModal(false)}
          onCreated={() => {
            if (onClientCreated) onClientCreated();
          }}
        />
      )}
    </div>
  );
}

