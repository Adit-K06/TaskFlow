// KanbanBoard — 3-column interactive board (Not Started, Ongoing, Completed)
"use client";

import { useState } from "react";
import { Plus, CheckCircle2, Clock, CircleAlert, Calendar as CalendarIcon, FolderPlus, WifiOff, RefreshCw, Loader2 } from "lucide-react";
import { TaskStatus, Client } from "@/lib/types";
import { useTasks } from "@/hooks/useTasks";
import { useClients } from "@/hooks/useClients";
import { api } from "@/lib/api";
import ClientColorChip from "./ClientColorChip";
import ProgressBar from "./ProgressBar";
import NewTaskModal from "./NewTaskModal";
import NewClientModal from "./NewClientModal";
import Sidebar from "./Sidebar";
import { formatShort, getDueColorClass } from "@/lib/dateUtils";

interface ColumnDef {
  status: TaskStatus;
  label: string;
  color: string;
  icon: React.ElementType;
}

const COLUMNS: ColumnDef[] = [
  { status: "not_started", label: "Not Started", color: "var(--muted)", icon: CircleAlert },
  { status: "ongoing", label: "Ongoing", color: "var(--accent)", icon: Clock },
  { status: "completed", label: "Completed", color: "var(--success)", icon: CheckCircle2 },
];

export default function KanbanBoard() {
  const { tasks, loading: tasksLoading, error: tasksError, refetch: refreshTasks } = useTasks();
  const { clients, loading: clientsLoading, error: clientsError, refetch: refreshClients } = useClients();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  const loading = tasksLoading || clientsLoading;
  const error = tasksError || clientsError;

  const clientMap: Record<string, Client> = clients
    ? Object.fromEntries(clients.map((c) => [c.id, c]))
    : {};

  async function handleDrop(targetStatus: TaskStatus) {
    if (!draggedTaskId) return;
    const task = tasks.find((t) => t.id === draggedTaskId);
    if (!task || task.status === targetStatus) {
      setDraggedTaskId(null);
      setDragOverColumn(null);
      return;
    }

    // Optimistic local update
    const patch = {
      status: targetStatus,
      is_completed: targetStatus === "completed",
    };

    setDraggedTaskId(null);
    setDragOverColumn(null);

    try {
      await api.tasks.update(task.id, patch);
      refreshTasks();
    } catch {
      refreshTasks();
    }
  }

  function handleRetry() {
    refreshTasks();
    refreshClients();
  }

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header
          className="px-6 py-4 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        >
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{
                fontFamily: "Fraunces, var(--font-fraunces), Georgia, serif",
                color: "var(--text)",
              }}
            >
              Board View
            </h1>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Drag and drop tasks between columns to update status
            </p>
          </div>

          <button
            onClick={() => {
              if (clients && clients.length === 0) {
                setShowNewClientModal(true);
              } else {
                setShowNewTaskModal(true);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: "var(--accent)", color: "#fff" }}
          >
            <Plus size={15} />
            {clients && clients.length === 0 ? "Create Client" : "Add Task"}
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-x-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent)" }} />
            </div>
          ) : error ? (
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
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90 active:scale-95 shadow-md"
                style={{ backgroundColor: "var(--accent)", color: "#fff" }}
              >
                <RefreshCw size={14} />
                Retry Connection
              </button>
            </div>
          ) : clients && clients.length === 0 ? (
            <div className="text-center py-16 px-6 flex flex-col items-center justify-center gap-4 border rounded-2xl max-w-md mx-auto my-10 shadow-sm" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
              <div className="p-4 rounded-full" style={{ backgroundColor: "rgba(181,80,47,0.12)", color: "var(--accent)" }}>
                <FolderPlus size={36} />
              </div>
              <div className="max-w-sm">
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "Fraunces, var(--font-fraunces), Georgia, serif", color: "var(--text)" }}>
                  Welcome to TaskFlow!
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                  To view board tasks, please create your first client. Tasks are assigned under specific clients.
                </p>
              </div>
              <button
                id="kanban-create-first-client-btn"
                onClick={() => setShowNewClientModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90 active:scale-95 shadow-md"
                style={{ backgroundColor: "var(--accent)", color: "#fff" }}
              >
                <Plus size={15} />
                Create First Client
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-w-[800px]">
              {COLUMNS.map((col) => {
                const colTasks = tasks.filter((t) => t.status === col.status);
                const isOver = dragOverColumn === col.status;
                const Icon = col.icon;

                return (
                  <div
                    key={col.status}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverColumn(col.status);
                    }}
                    onDragLeave={() => setDragOverColumn(null)}
                    onDrop={() => handleDrop(col.status)}
                    className="flex flex-col rounded-2xl border p-4 transition-colors"
                    style={{
                      backgroundColor: isOver ? "rgba(255,255,255,0.03)" : "var(--surface)",
                      borderColor: isOver ? "var(--accent)" : "var(--border)",
                    }}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: "var(--border)" }}>
                      <div className="flex items-center gap-2">
                        <Icon size={16} style={{ color: col.color }} />
                        <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                          {col.label}
                        </h2>
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-bold tabular-nums"
                          style={{ backgroundColor: "var(--bg)", color: "var(--muted)" }}
                        >
                          {colTasks.length}
                        </span>
                      </div>

                      <button
                        onClick={() => setShowNewTaskModal(true)}
                        className="p-1 rounded-md hover:bg-white/10 transition-colors"
                        style={{ color: "var(--muted)" }}
                        title={`Add task to ${col.label}`}
                      >
                        <Plus size={15} />
                      </button>
                    </div>

                    {/* Column Cards */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      {colTasks.map((task) => {
                        const client = clientMap[task.client_id];
                        const isDragging = draggedTaskId === task.id;
                        const dueClass = getDueColorClass(task.due_date, task.is_completed);

                        return (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={() => setDraggedTaskId(task.id)}
                            onDragEnd={() => setDraggedTaskId(null)}
                            className="p-4 rounded-xl border transition-all cursor-grab active:cursor-grabbing hover:shadow-lg group"
                            style={{
                              backgroundColor: "var(--bg)",
                              borderColor: "var(--border)",
                              opacity: isDragging ? 0.4 : 1,
                            }}
                          >
                            {/* Client tag */}
                            {client && (
                              <div className="mb-2">
                                <ClientColorChip color={client.color} name={client.name} />
                              </div>
                            )}

                            {/* Task Name */}
                            <h3
                              className="text-sm font-medium mb-2 group-hover:text-[var(--accent)] transition-colors"
                              style={{
                                color: "var(--text)",
                                textDecoration: task.is_completed ? "line-through" : "none",
                              }}
                            >
                              {task.name}
                            </h3>

                            {/* Remarks */}
                            {task.remarks && (
                              <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--muted)" }}>
                                {task.remarks}
                              </p>
                            )}

                            {/* Progress */}
                            <div className="mb-3">
                              <ProgressBar
                                completed={task.completed_subtask_count}
                                total={task.subtask_count}
                                isCompleted={task.is_completed}
                              />
                            </div>

                            {/* Card Footer: Due date & Assignees */}
                            <div className="flex items-center justify-between text-xs pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                              {task.due_date ? (
                                <span
                                  className="flex items-center gap-1 font-medium tabular-nums"
                                  style={{ color: `var(--${dueClass})` }}
                                >
                                  <CalendarIcon size={12} />
                                  {formatShort(task.due_date)}
                                </span>
                              ) : (
                                <span style={{ color: "var(--muted)" }}>No due date</span>
                              )}

                              {task.assignees.length > 0 && (
                                <div className="flex gap-1">
                                  {task.assignees.map((a) => (
                                    <span
                                      key={a}
                                      className="w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center uppercase"
                                      style={{ backgroundColor: "rgba(181,80,47,0.2)", color: "var(--accent)" }}
                                      title={a}
                                    >
                                      {a.slice(0, 2)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {colTasks.length === 0 && (
                        <div
                          className="h-32 rounded-xl border border-dashed flex items-center justify-center text-xs"
                          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                        >
                          No tasks in {col.label.toLowerCase()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {showNewTaskModal && (
        <NewTaskModal
          clients={clients}
          onClose={() => setShowNewTaskModal(false)}
          onCreated={() => refreshTasks()}
          onOpenNewClientModal={() => setShowNewClientModal(true)}
        />
      )}
      {showNewClientModal && (
        <NewClientModal
          onClose={() => setShowNewClientModal(false)}
          onCreated={() => {
            refreshClients();
            refreshTasks();
          }}
        />
      )}
    </div>
  );
}

