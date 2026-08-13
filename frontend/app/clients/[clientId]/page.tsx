// Client task view — /clients/[clientId] — scoped task list for one client
"use client";

import { useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTasks } from "@/hooks/useTasks";
import { useClients } from "@/hooks/useClients";
import { Task } from "@/lib/types";
import Sidebar from "@/components/Sidebar";
import FilterBar, { FilterState } from "@/components/FilterBar";
import TaskTable from "@/components/TaskTable";
import DueBanner from "@/components/DueBanner";
import { differenceInCalendarDays, parseISO } from "date-fns";

const DEFAULT_FILTERS: FilterState = {
  statuses: [],
  startFrom: "",
  startTo: "",
  dueFrom: "",
  dueTo: "",
};

export default function ClientPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { clients, loading: clientsLoading, refetch: refetchClients } = useClients();
  const { tasks, loading: tasksLoading, error, refetch: refetchTasks } = useTasks(clientId);
  const [localTasks, setLocalTasks] = useState<Task[] | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const client = clients.find((c) => c.id === clientId);
  const displayTasks = localTasks ?? tasks;

  const handleTasksChange = useCallback((updated: Task[]) => {
    setLocalTasks(updated);
  }, []);

  const handleRetry = useCallback(() => {
    refetchClients();
    refetchTasks();
  }, [refetchClients, refetchTasks]);

  // Scroll to the first task due on a given day offset (0 = today, 1 = tomorrow)
  function scrollToFirstTaskDueIn(dayOffset: number) {
    const target = displayTasks.find(
      (t) =>
        !t.is_completed &&
        t.due_date &&
        differenceInCalendarDays(parseISO(t.due_date), new Date()) === dayOffset
    );
    if (!target) return;
    const el = document.getElementById(`task-row-${target.id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Brief highlight flash
      el.style.transition = "background-color 0.3s";
      el.style.backgroundColor = "rgba(181,80,47,0.25)";
      setTimeout(() => { el.style.backgroundColor = ""; }, 1500);
    }
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
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs mb-3 transition-colors hover:opacity-80"
            style={{ color: "var(--muted)" }}
          >
            <ArrowLeft size={12} />
            Home
          </Link>

          {clientsLoading ? (
            // True loading skeleton — only shown while clients are actually being fetched
            <div className="flex items-center gap-3">
              <div className="w-1 h-10 rounded-full animate-pulse" style={{ backgroundColor: "var(--border)" }} />
              <div>
                <div className="h-7 w-48 rounded animate-pulse mb-1" style={{ backgroundColor: "var(--border)" }} />
                <div className="h-4 w-24 rounded animate-pulse" style={{ backgroundColor: "var(--border)" }} />
              </div>
            </div>
          ) : client ? (
            <div className="flex items-center gap-3">
              {/* Color tab */}
              <div
                className="w-1 h-10 rounded-full shrink-0"
                style={{ backgroundColor: client.color }}
              />
              <div>
                <h1
                  className="text-2xl font-semibold leading-tight"
                  style={{
                    fontFamily: "Fraunces, var(--font-fraunces), Georgia, serif",
                    color: "var(--text)",
                  }}
                >
                  {client.name}
                </h1>
                {client.category && (
                  <p
                    className="text-sm italic"
                    style={{
                      fontFamily: "Fraunces, var(--font-fraunces), Georgia, serif",
                      color: "var(--muted)",
                    }}
                  >
                    {client.category}
                  </p>
                )}
              </div>
            </div>
          ) : (
            // Client not found after loading — show a clean message
            <div>
              <h1
                className="text-2xl font-semibold leading-tight"
                style={{
                  fontFamily: "Fraunces, var(--font-fraunces), Georgia, serif",
                  color: "var(--muted)",
                }}
              >
                Client not found
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                This client may have been deleted.
              </p>
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-4">
          {/* Due date banner — shows when tasks are due today or tomorrow */}
          <DueBanner
            tasks={displayTasks}
            onScrollToToday={() => scrollToFirstTaskDueIn(0)}
            onScrollToTomorrow={() => scrollToFirstTaskDueIn(1)}
          />

          {/* Filter bar */}
          <div className="mb-4">
            <FilterBar filters={filters} onChange={setFilters} />
          </div>

          {/* Task table */}
          <TaskTable
            tasks={displayTasks}
            loading={tasksLoading}
            error={error}
            clientId={clientId}
            clients={clients}
            showClient={false}
            filters={filters}
            onTasksChange={handleTasksChange}
            onRetry={handleRetry}
            onClientCreated={handleRetry}
          />
        </div>
      </main>
    </div>
  );
}
