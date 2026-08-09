// Home page "/" — all tasks from all clients, due banner, filters, task table
"use client";

import { useState, useRef, useCallback } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useClients } from "@/hooks/useClients";
import { Task } from "@/lib/types";
import Sidebar from "@/components/Sidebar";
import DueBanner from "@/components/DueBanner";
import FilterBar, { FilterState } from "@/components/FilterBar";
import TaskTable from "@/components/TaskTable";

const DEFAULT_FILTERS: FilterState = {
  statuses: [],
  startFrom: "",
  startTo: "",
  dueFrom: "",
  dueTo: "",
};

export default function HomePage() {
  const { tasks, loading: tasksLoading, error: tasksError, refetch: refetchTasks } = useTasks();
  const { clients, loading: clientsLoading, error: clientsError, refetch: refetchClients } = useClients();
  const [localTasks, setLocalTasks] = useState<Task[] | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [flashTaskId, setFlashTaskId] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const loading = tasksLoading || clientsLoading;
  const error = tasksError || clientsError;
  const displayTasks = localTasks ?? tasks;

  const handleTasksChange = useCallback((updated: Task[]) => {
    setLocalTasks(updated);
  }, []);

  const handleRetry = useCallback(() => {
    refetchTasks();
    refetchClients();
  }, [refetchTasks, refetchClients]);

  const handleClientCreated = useCallback(() => {
    refetchClients();
    refetchTasks();
  }, [refetchClients, refetchTasks]);

  function scrollToTasksForDay(dayOffset: number) {
    const today = new Date();
    today.setDate(today.getDate() + dayOffset);
    const targetDate = today.toISOString().slice(0, 10);
    const monthKey = targetDate.slice(0, 7);

    // Find a task row with that due date
    const target = displayTasks.find(
      (t) => t.due_date === targetDate && !t.is_completed
    );

    if (target) {
      const el = document.getElementById(`task-row-${target.id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setFlashTaskId(target.id);
        setTimeout(() => setFlashTaskId(null), 1600);
        return;
      }
    }

    // Fallback: scroll to month group header
    const groupEl = document.getElementById(`month-group-${monthKey}`);
    groupEl?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden pt-14 md:pt-0">
        {/* Page header */}
        <div
          className="shrink-0 px-6 pt-6 pb-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h1
            className="text-2xl font-semibold mb-1"
            style={{
              fontFamily: "Fraunces, var(--font-fraunces), Georgia, serif",
              color: "var(--text)",
            }}
          >
            All Tasks
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Combined view across all clients
          </p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4" ref={tableRef}>
          {/* Due banner */}
          <DueBanner
            tasks={displayTasks}
            onScrollToToday={() => scrollToTasksForDay(0)}
            onScrollToTomorrow={() => scrollToTasksForDay(1)}
          />

          {/* Filter bar */}
          <div className="mb-4">
            <FilterBar filters={filters} onChange={setFilters} />
          </div>

          {/* Task table */}
          <TaskTable
            tasks={displayTasks}
            loading={loading}
            error={error}
            clients={clients}
            showClient
            filters={filters}
            onTasksChange={handleTasksChange}
            flashTaskId={flashTaskId}
            onRetry={handleRetry}
            onClientCreated={handleClientCreated}
          />
        </div>
      </main>
    </div>
  );
}
