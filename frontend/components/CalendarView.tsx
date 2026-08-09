// CalendarView — Month grid view with task due date pills, status toggles & day detail popover
"use client";

import { useState } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, X, Plus, FolderPlus, WifiOff, RefreshCw, Loader2 } from "lucide-react";
import { Task, Client } from "@/lib/types";
import { useTasks } from "@/hooks/useTasks";
import { useClients } from "@/hooks/useClients";
import { api } from "@/lib/api";
import Sidebar from "./Sidebar";
import ClientColorChip from "./ClientColorChip";
import NewTaskModal from "./NewTaskModal";
import NewClientModal from "./NewClientModal";

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  const { tasks, loading: tasksLoading, error: tasksError, refetch: refreshTasks } = useTasks();
  const { clients, loading: clientsLoading, error: clientsError, refetch: refreshClients } = useClients();

  const loading = tasksLoading || clientsLoading;
  const error = tasksError || clientsError;

  const clientMap: Record<string, Client> = clients
    ? Object.fromEntries(clients.map((c) => [c.id, c]))
    : {};

  // Calendar math
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  function getTasksForDay(day: Date): Task[] {
    const dayStr = format(day, "yyyy-MM-dd");
    return tasks.filter((t) => t.due_date === dayStr);
  }

  async function handleToggleDone(task: Task) {
    const patch = {
      is_completed: !task.is_completed,
      status: (!task.is_completed ? "completed" : "ongoing") as Task["status"],
    };
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

  const selectedDayTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Bar */}
        <header
          className="px-6 py-4 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        >
          <div className="flex items-center gap-4">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{
                fontFamily: "Fraunces, var(--font-fraunces), Georgia, serif",
                color: "var(--text)",
              }}
            >
              {format(currentMonth, "MMMM yyyy")}
            </h1>

            <div className="flex items-center gap-1 border rounded-lg p-0.5" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1.5 rounded hover:bg-white/10 transition-colors"
                style={{ color: "var(--muted)" }}
                title="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-1 text-xs font-semibold rounded hover:bg-white/10 transition-colors"
                style={{ color: "var(--accent)" }}
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1.5 rounded hover:bg-white/10 transition-colors"
                style={{ color: "var(--muted)" }}
                title="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
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

        {loading ? (
          <div className="flex items-center justify-center flex-1">
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
                To view calendar tasks, please create your first client. Tasks belong to clients in TaskFlow.
              </p>
            </div>
            <button
              id="calendar-create-first-client-btn"
              onClick={() => setShowNewClientModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90 active:scale-95 shadow-md"
              style={{ backgroundColor: "var(--accent)", color: "#fff" }}
            >
              <Plus size={15} />
              Create First Client
            </button>
          </div>
        ) : (
          <>
            {/* Calendar Grid Header (Weekdays) */}
            <div className="grid grid-cols-7 border-b text-center text-[11px] font-semibold uppercase tracking-widest py-2 shrink-0" style={{ borderColor: "var(--border)", color: "var(--muted)", backgroundColor: "var(--surface)" }}>
              {weekDays.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-px overflow-y-auto" style={{ backgroundColor: "var(--border)" }}>
              {days.map((day) => {
                const dayTasks = getTasksForDay(day);
                const inCurrentMonth = isSameMonth(day, currentMonth);
                const currentDayIsToday = isToday(day);
                const isSelected = selectedDay && isSameDay(day, selectedDay);

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => setSelectedDay(day)}
                    className="p-2 flex flex-col justify-between transition-colors cursor-pointer min-h-[90px]"
                    style={{
                      backgroundColor: isSelected
                        ? "rgba(181,80,47,0.12)"
                        : inCurrentMonth
                        ? "var(--surface)"
                        : "rgba(0,0,0,0.2)",
                      opacity: inCurrentMonth ? 1 : 0.4,
                    }}
                  >
                    {/* Day number */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold tabular-nums ${
                          currentDayIsToday ? "shadow-md" : ""
                        }`}
                        style={{
                          backgroundColor: currentDayIsToday ? "var(--accent)" : "transparent",
                          color: currentDayIsToday ? "#fff" : "var(--text)",
                        }}
                      >
                        {format(day, "d")}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg)", color: "var(--muted)" }}>
                          {dayTasks.length}
                        </span>
                      )}
                    </div>

                    {/* Day task pills */}
                    <div className="space-y-1 overflow-hidden flex-1">
                      {dayTasks.slice(0, 3).map((task) => {
                        const client = clientMap[task.client_id];
                        return (
                          <div
                            key={task.id}
                            className="px-1.5 py-0.5 rounded text-[11px] font-medium truncate flex items-center gap-1"
                            style={{
                              backgroundColor: client ? `${client.color}22` : "rgba(255,255,255,0.06)",
                              borderLeft: client ? `3px solid ${client.color}` : "none",
                              color: "var(--text)",
                              textDecoration: task.is_completed ? "line-through" : "none",
                              opacity: task.is_completed ? 0.6 : 1,
                            }}
                            title={`${task.name} (${client?.name ?? "No client"})`}
                          >
                            <span className="truncate">{task.name}</span>
                          </div>
                        );
                      })}
                      {dayTasks.length > 3 && (
                        <span className="text-[10px] font-semibold pl-1" style={{ color: "var(--accent)" }}>
                          +{dayTasks.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Selected Day Tasks Drawer/Modal */}
      {selectedDay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={(e) => e.target === e.currentTarget && setSelectedDay(null)}
        >
          <div
            className="rounded-2xl border shadow-2xl w-full max-w-md p-6"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div>
                <h3 className="text-lg font-semibold" style={{ fontFamily: "Fraunces, var(--font-fraunces), Georgia, serif", color: "var(--text)" }}>
                  {format(selectedDay, "EEEE, MMMM d, yyyy")}
                </h3>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {selectedDayTasks.length} {selectedDayTasks.length === 1 ? "task" : "tasks"} due on this day
                </p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                style={{ color: "var(--muted)" }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {selectedDayTasks.map((task) => {
                const client = clientMap[task.client_id];
                return (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl border flex items-start gap-3"
                    style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)" }}
                  >
                    <input
                      type="checkbox"
                      checked={task.is_completed}
                      onChange={() => handleToggleDone(task)}
                      className="mt-1 w-4 h-4 rounded cursor-pointer accent-[var(--accent)]"
                    />
                    <div className="flex-1 min-w-0">
                      {client && (
                        <div className="mb-1">
                          <ClientColorChip color={client.color} name={client.name} />
                        </div>
                      )}
                      <h4
                        className="text-sm font-medium"
                        style={{
                          color: "var(--text)",
                          textDecoration: task.is_completed ? "line-through" : "none",
                        }}
                      >
                        {task.name}
                      </h4>
                      {task.remarks && (
                        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                          {task.remarks}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {selectedDayTasks.length === 0 && (
                <div className="text-center py-8 text-xs" style={{ color: "var(--muted)" }}>
                  No tasks due on this date.
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedDay(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium border"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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

