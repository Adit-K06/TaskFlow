// Client task view — /clients/[clientId] — scoped task list for one client
"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTasks } from "@/hooks/useTasks";
import { useClients } from "@/hooks/useClients";
import { Task } from "@/lib/types";
import Sidebar from "@/components/Sidebar";
import FilterBar, { FilterState } from "@/components/FilterBar";
import TaskTable from "@/components/TaskTable";

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

  const { clients } = useClients();
  const { tasks, loading, error } = useTasks(clientId);
  const [localTasks, setLocalTasks] = useState<Task[] | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const client = clients.find((c) => c.id === clientId);
  const displayTasks = localTasks ?? tasks;

  const handleTasksChange = useCallback((updated: Task[]) => {
    setLocalTasks(updated);
  }, []);

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
            All Tasks
          </Link>

          {client ? (
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
            // Skeleton
            <div className="flex items-center gap-3">
              <div className="w-1 h-10 rounded-full bg-white/10" />
              <div>
                <div className="h-7 w-48 rounded bg-white/10 mb-1" />
                <div className="h-4 w-24 rounded bg-white/10" />
              </div>
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Filter bar */}
          <div className="mb-4">
            <FilterBar filters={filters} onChange={setFilters} />
          </div>

          {/* Task table */}
          <TaskTable
            tasks={displayTasks}
            loading={loading}
            error={error}
            clientId={clientId}
            showClient={false}
            filters={filters}
            onTasksChange={handleTasksChange}
          />
        </div>
      </main>
    </div>
  );
}
